using MetaLink.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;
using System.Collections.Concurrent;
using MetaLink.Domain.Services;
using MetaLink.Application.Interfaces;

namespace MetaLink.API.Hubs
{
    [Authorize]
    public class GameHub : Hub
    {
        private readonly IGameService _gameService;
        private readonly IGameInviteService _gameInviteService;
        private readonly IChatGptService _chatGptService;
        private static readonly Dictionary<string, string> _gameSessions = new();
        private static readonly Dictionary<string, (List<string> ConnectionIds, DateTime InviteSentTime, int InviterId)> _pendingInvites = new();
        private static readonly ConcurrentDictionary<string, Dictionary<int, BattleshipPlayerState>> _battleshipStates = new();
        private static readonly ConcurrentDictionary<string, ChessGameState> _chessGameStates = new();
        private static readonly ConcurrentDictionary<string, QuizSessionState> _quizSessions = new();

        public GameHub(IGameService gameService, IGameInviteService gameInviteService, IChatGptService chatGptService)
        {
            _gameService = gameService;
            _gameInviteService = gameInviteService;
            _chatGptService = chatGptService;
            //_ = Task.Run(CheckInviteTimeouts);
        }

        private class ChessGameState
        {
            public string CurrentPlayer { get; set; }
            public Dictionary<int, string> PlayerColors { get; set; }
        }

        private class BattleshipPlayerState
        {
            public List<Ship> Ships { get; set; } = new List<Ship>();
            public int[,] Grid { get; set; } = new int[12, 12];
        }

        private class Ship
        {
            public string Id { get; set; }
            public List<(int x, int y)> Coordinates { get; set; }
            public int Size { get; set; }
            public int Hits { get; set; }
            public bool IsSunk => Hits >= Size;
        }

        public class QuizSessionState
        {
            public int CurrentQuestionIndex { get; set; } = 0;
            public List<Question> Questions { get; set; }
            public Dictionary<int, List<PlayerAnswer>> Answers { get; set; } = new();
            public Dictionary<int, int> Scores { get; set; } = new();
            public int InviterId { get; set; }
            public List<int> Players { get; set; } = new List<int>();
            public bool IsQuestionActive { get; set; } = false;
            public DateTime QuestionStartTime { get; set; }
        }

        public class PlayerAnswer
        {
            public int StudentId { get; set; }
            public int AnswerIndex { get; set; }
            public double TimeTaken { get; set; }
            public DateTime ReceivedTime { get; set; }
        }

        public class PlayerResult
        {
            public int StudentId { get; set; }
            public int SelectedAnswer { get; set; }
            public bool IsCorrect { get; set; }
            public int Score { get; set; }
        }

        public class Question
        {
            public string Text { get; set; }
            public List<string> Answers { get; set; }
            public int CorrectAnswer { get; set; }
        }

        private async Task StartQuiz(int inviterId, string sessionId, string topic)
        {
            var state = new QuizSessionState
            {
                InviterId = inviterId
            };

            try
            {
                var aiQuestions = await _chatGptService.GenerateQuizQuestionsAsync(topic);
                state.Questions = aiQuestions.Select(q => new Question
                {
                    Text = q.Text,
                    Answers = q.Answers,
                    CorrectAnswer = q.CorrectAnswer
                }).ToList();

                Console.WriteLine($"[StartQuiz] AI-generated questions for topic '{topic}': {System.Text.Json.JsonSerializer.Serialize(state.Questions)}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[StartQuiz] Error generating questions for topic '{topic}': {ex.Message}");
                await Clients.Group(sessionId).SendAsync("InviteError", new { Message = "Sorular oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." });
                return;
            }

            state.Players.Add(inviterId);
            state.Scores[inviterId] = 0;

            if (_pendingInvites.TryGetValue(sessionId, out var inviteData))
            {
                var invite = await _gameInviteService.GetInviteByIdAsync(int.Parse(sessionId.Split('_')[1]));
                if (invite != null)
                {
                    int inviteeId = invite.ToStudentId;
                    if (!state.Players.Contains(inviteeId))
                    {
                        state.Players.Add(inviteeId);
                        state.Scores[inviteeId] = 0;
                        Console.WriteLine($"[StartQuiz] Invitee {inviteeId} added to session {sessionId}.");
                    }
                }
            }
            else
            {
                Console.WriteLine($"[StartQuiz] Warning: No pending invite found for session {sessionId}. Only inviter will play.");
            }

            if (_quizSessions.TryAdd(sessionId, state))
            {
                Console.WriteLine($"[StartQuiz] Session {sessionId} successfully added to _quizSessions. Players: {string.Join(", ", state.Players)}");
            }
            else
            {
                Console.WriteLine($"[StartQuiz] Failed to add session {sessionId} to _quizSessions.");
                await Clients.Group(sessionId).SendAsync("InviteError", new { Message = "Oyun başlatılamadı: Oturum oluşturulamadı." });
                return;
            }

            await SendQuestion(sessionId, state.CurrentQuestionIndex);
        }

        private async Task SendQuestion(string sessionId, int questionIndex)
        {
            if (!_quizSessions.TryGetValue(sessionId, out var state))
            {
                Console.WriteLine($"[SendQuestion] Error: SessionId {sessionId} not found.");
                return;
            }

            if (questionIndex >= state.Questions.Count)
            {
                state.IsQuestionActive = false;
                var finalScores = state.Scores.ToDictionary(kvp => kvp.Key.ToString(), kvp => kvp.Value);
                Console.WriteLine($"[SendQuestion] Quiz ended for session {sessionId}, FinalScores={System.Text.Json.JsonSerializer.Serialize(finalScores)}");
                await Clients.Group(sessionId).SendAsync("QuizEnded", new { FinalScores = finalScores });
                _quizSessions.TryRemove(sessionId, out _);
                return;
            }

            var question = state.Questions[questionIndex];
            state.IsQuestionActive = true;
            state.QuestionStartTime = DateTime.UtcNow;
            Console.WriteLine($"[SendQuestion] Sending question: {question.Text}, SessionId={sessionId}, QuestionIndex={questionIndex}, StartTime={state.QuestionStartTime}");

            await Clients.Group(sessionId).SendAsync("QuestionStarted", new
            {
                SessionId = sessionId,
                QuestionIndex = questionIndex,
                QuestionText = question.Text
            });

            await Clients.Group(sessionId).SendAsync("OptionsShown", new
            {
                SessionId = sessionId,
                QuestionIndex = questionIndex,
                Options = question.Answers
            });

            state.Answers[questionIndex] = new List<PlayerAnswer>();
            Console.WriteLine($"[SendQuestion] Waiting for all players to answer for session {sessionId}, question {questionIndex}...");
        }

        public async Task SendAnswer(string sessionId, int studentId, int questionIndex, int answerIndex, double timeTaken)
        {
            var receivedTime = DateTime.UtcNow;
            Console.WriteLine($"[SendAnswer] Received: SessionId={sessionId}, StudentId={studentId}, QuestionIndex={questionIndex}, AnswerIndex={answerIndex}, TimeTaken={timeTaken}, ReceivedTime={receivedTime}");

            if (string.IsNullOrEmpty(sessionId))
            {
                Console.WriteLine($"[SendAnswer] Error: sessionId null or empty.");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Geçersiz oturum kimliği." });
                return;
            }

            if (!_quizSessions.TryGetValue(sessionId, out var state))
            {
                Console.WriteLine($"[SendAnswer] Error: SessionId {sessionId} not found in _quizSessions.");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Oturum bulunamadı. Lütfen oyunu yeniden başlatın." });
                return;
            }

            if (state.CurrentQuestionIndex != questionIndex)
            {
                Console.WriteLine($"[SendAnswer] Error: Invalid questionIndex. Expected: {state.CurrentQuestionIndex}, Received: {questionIndex}");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Geçersiz soru indeksi." });
                return;
            }

            bool isNewAnswerRecorded = false;

            lock (state.Answers)
            {
                if (!state.Answers.ContainsKey(questionIndex))
                {
                    state.Answers[questionIndex] = new List<PlayerAnswer>();
                }

                if (!state.Answers[questionIndex].Any(a => a.StudentId == studentId))
                {
                    state.Answers[questionIndex].Add(new PlayerAnswer
                    {
                        StudentId = studentId,
                        AnswerIndex = answerIndex,
                        TimeTaken = timeTaken,
                        ReceivedTime = receivedTime
                    });

                    Console.WriteLine($"[SendAnswer] Answer recorded: StudentId={studentId}, QuestionIndex={questionIndex}, AnswerIndex={answerIndex}, TimeTaken={timeTaken}, ReceivedTime={receivedTime}");
                    isNewAnswerRecorded = true;
                }
                else
                {
                    Console.WriteLine($"[SendAnswer] Error: StudentId {studentId} already answered this question.");
                }
            }

            if (isNewAnswerRecorded)
            {
                await Clients.Caller.SendAsync("AnswerReceived", new
                {
                    StudentId = studentId,
                    QuestionIndex = questionIndex,
                    AnswerIndex = answerIndex,
                    TimeTaken = timeTaken
                });

                lock (state.Answers)
                {
                    var answers = state.Answers.GetValueOrDefault(questionIndex, new List<PlayerAnswer>());
                    if (answers.Count >= state.Players.Count)
                    {
                        state.IsQuestionActive = false;
                        Console.WriteLine($"[SendAnswer] All players answered for session {sessionId}, question {questionIndex}, EndTime={DateTime.UtcNow}");

                        var results = CalculateResults(state, questionIndex);
                        var correctAnswer = state.Questions[questionIndex].CorrectAnswer;
                        Console.WriteLine($"[SendAnswer] Sending QuestionEnded for session {sessionId}, question {questionIndex}, Results={System.Text.Json.JsonSerializer.Serialize(results)}, CorrectAnswer={correctAnswer}");
                        Clients.Group(sessionId).SendAsync("QuestionEnded", new
                        {
                            SessionId = sessionId,
                            QuestionIndex = questionIndex,
                            Results = results,
                            CorrectAnswer = correctAnswer
                        }).GetAwaiter().GetResult();
                    }
                }
            }
        }

        private List<PlayerResult> CalculateResults(QuizSessionState state, int questionIndex)
        {
            var question = state.Questions[questionIndex];
            var answers = state.Answers.ContainsKey(questionIndex) ? state.Answers[questionIndex] : new List<PlayerAnswer>();

            var correctAnswers = answers
                .Where(a => a.AnswerIndex == question.CorrectAnswer)
                .OrderBy(a => a.TimeTaken)
                .ToList();

            int score = 10;
            foreach (var answer in correctAnswers)
            {
                state.Scores[answer.StudentId] = state.Scores.GetValueOrDefault(answer.StudentId, 0) + score;
                score = Math.Max(score - 2, 0);
            }

            var results = new List<PlayerResult>();
            foreach (var answer in answers)
            {
                results.Add(new PlayerResult
                {
                    StudentId = answer.StudentId,
                    SelectedAnswer = answer.AnswerIndex,
                    IsCorrect = answer.AnswerIndex == question.CorrectAnswer,
                    Score = state.Scores.GetValueOrDefault(answer.StudentId, 0)
                });
            }

            foreach (var playerId in state.Players)
            {
                if (!results.Any(r => r.StudentId == playerId))
                {
                    results.Add(new PlayerResult
                    {
                        StudentId = playerId,
                        SelectedAnswer = -1,
                        IsCorrect = false,
                        Score = state.Scores.GetValueOrDefault(playerId, 0)
                    });
                }
            }

            Console.WriteLine($"[CalculateResults] QuestionIndex={questionIndex}, Results={System.Text.Json.JsonSerializer.Serialize(results)}");
            return results;
        }

        public async Task NextQuestion(string sessionId)
        {
            if (_quizSessions.TryGetValue(sessionId, out var state))
            {
                if (Context.UserIdentifier != state.InviterId.ToString())
                {
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Sadece davet eden bir sonraki soruya geçebilir." });
                    return;
                }

                state.CurrentQuestionIndex++;
                if (state.CurrentQuestionIndex < state.Questions.Count)
                {
                    await SendQuestion(sessionId, state.CurrentQuestionIndex);
                }
                else
                {
                    await Clients.Group(sessionId).SendAsync("QuizEnded", new
                    {
                        SessionId = sessionId,
                        FinalScores = state.Scores
                    });
                    _quizSessions.TryRemove(sessionId, out _);
                }
            }
        }

        public async Task SendInvite(int senderId, int receiverId, int gameId)
        {
            try
            {
                DateTime inviteTime = DateTime.Now;
                var invite = await _gameInviteService.SendInviteAsync(senderId, receiverId, gameId);
                string sessionId = $"{gameId}_{invite.Id}";

                if (!_pendingInvites.ContainsKey(sessionId))
                {
                    _pendingInvites[sessionId] = (new List<string> { Context.ConnectionId }, inviteTime, senderId);
                }

                await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
                Console.WriteLine($"[SendInvite] InviterId: {senderId}, ReceiverId: {receiverId}, GameId: {gameId}, SessionId: {sessionId}, InviteId: {invite.Id}");

                await Clients.User(receiverId.ToString()).SendAsync("ReceiveInvite", new
                {
                    SenderId = senderId,
                    GameId = gameId,
                    SessionId = sessionId,
                    InviteId = invite.Id
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SendInvite] Error: {ex.Message}");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Failed to send invite." });
            }
        }

        public async Task AcceptInvite(int studentId, int inviteId)
        {
            var invite = await _gameInviteService.AcceptInviteAsync(inviteId);

            if (invite != null)
            {
                string sessionId = $"{invite.GameId}_{invite.Id}";
                _gameSessions[Context.ConnectionId] = sessionId;

                await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
                Console.WriteLine($"[AcceptInvite] Invite accepted. InviteId: {inviteId}, AcceptedBy: {studentId}, GameId: {invite.GameId}, SessionId: {sessionId}");

                await Clients.Group(sessionId).SendAsync("InviteAccepted", new
                {
                    InviterId = invite.FromStudentId,
                    InviteeId = studentId,
                    GameId = invite.GameId,
                    SessionId = sessionId,
                    InviteId = inviteId
                });

                if (_pendingInvites.ContainsKey(sessionId))
                {
                    _pendingInvites[sessionId].ConnectionIds.Add(Context.ConnectionId);
                }

                if (_quizSessions.TryGetValue(sessionId, out var state))
                {
                    state.Players.Add(studentId);
                    state.Scores[studentId] = 0;
                    Console.WriteLine($"[AcceptInvite] StudentId {studentId} quiz session {sessionId} players listesine eklendi.");
                }

                if (invite.GameId == 10 && !_battleshipStates.ContainsKey(sessionId))
                {
                    _battleshipStates[sessionId] = new Dictionary<int, BattleshipPlayerState>
                    {
                        { invite.FromStudentId, new BattleshipPlayerState() },
                        { studentId, new BattleshipPlayerState() }
                    };
                }
            }
            else
            {
                Console.WriteLine($"[AcceptInvite] Invalid or expired inviteId: {inviteId} by studentId: {studentId}");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Invalid or expired invite." });
            }
        }

        public async Task DeclineInvite(int studentId, int inviteId)
        {
            var invite = await _gameInviteService.CancelInviteAsync(inviteId);

            if (invite != null)
            {
                Console.WriteLine($"[DeclineInvite] InviteId: {inviteId} declined by studentId: {studentId}, originally sent by: {invite.FromStudentId}");
                await Clients.User(invite.FromStudentId.ToString()).SendAsync("InviteDeclined", new
                {
                    StudentId = studentId,
                    InviteId = inviteId
                });
            }
        }

        public async Task StartGame(int studentId, int gameId, string sessionId, string difficulty, string initialGameState = null, string topic = null)
        {
            Console.WriteLine($"[StartGame] Called. StudentId: {studentId}, GameId: {gameId}, SessionId: {sessionId}, Difficulty: {difficulty}, InitialGameState: {initialGameState}, Topic: {topic}");
            try
            {
                if (!_pendingInvites.ContainsKey(sessionId))
                {
                    Console.WriteLine($"[StartGame] Error: SessionId {sessionId} not found in _pendingInvites.");
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Oturum bulunamadı veya davet süresi doldu." });
                    return;
                }
                Console.WriteLine($"[StartGame] _pendingInvites found: {JsonSerializer.Serialize(_pendingInvites[sessionId])}");
                if (_pendingInvites[sessionId].InviterId != studentId)
                {
                    Console.WriteLine($"[StartGame] Error: StudentId {studentId} is not the inviter.");
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Sadece davet eden oyuncu oyunu başlatabilir." });
                    return;
                }
                var connectionIds = _pendingInvites[sessionId].ConnectionIds;
                if (connectionIds.Count < 2)
                {
                    Console.WriteLine($"[StartGame] Error: Not enough players. ConnectionIds: {JsonSerializer.Serialize(connectionIds)}");
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Oyunu başlatmak için yeterli oyuncu yok." });
                    return;
                }

                foreach (var connId in connectionIds)
                {
                    _gameSessions[connId] = sessionId;
                }

                string gameState = initialGameState;

                if (gameId == 6) // MemoryGame
                {
                    List<string> emojis;
                    switch (difficulty)
                    {
                        case "4x4":
                            emojis = new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼" };
                            break;
                        case "5x4":
                            emojis = new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🦁", "🐯" };
                            break;
                        case "6x6":
                            emojis = new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🦁", "🐯", "🐨", "🐵", "🐷", "🐸", "🐴", "🦒", "🦓", "🦒" };
                            break;
                        default:
                            emojis = new List<string> { "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼" };
                            break;
                    }
                    var duplicatedEmojis = emojis.Concat(emojis).ToList();
                    duplicatedEmojis = duplicatedEmojis.OrderBy(x => Guid.NewGuid()).ToList();
                    gameState = System.Text.Json.JsonSerializer.Serialize(duplicatedEmojis);
                }
                else if (gameId == 7) // ShapeMatchGame
                {
                    List<Dictionary<string, string>> shapeColors;
                    switch (difficulty)
                    {
                        case "2x2":
                            shapeColors = new List<Dictionary<string, string>>
                            {
                                new Dictionary<string, string> { { "shape", "circle" }, { "color", "red" } },
                                new Dictionary<string, string> { { "shape", "square" }, { "color", "blue" } },
                            };
                            break;
                        case "3x2":
                            shapeColors = new List<Dictionary<string, string>>
                            {
                                new Dictionary<string, string> { { "shape", "circle" }, { "color", "red" } },
                                new Dictionary<string, string> { { "shape", "square" }, { "color", "blue" } },
                                new Dictionary<string, string> { { "shape", "triangle" }, { "color", "yellow" } },
                            };
                            break;
                        case "4x4":
                            shapeColors = new List<Dictionary<string, string>>
                            {
                                new Dictionary<string, string> { { "shape", "circle" }, { "color", "red" } },
                                new Dictionary<string, string> { { "shape", "square" }, { "color", "blue" } },
                                new Dictionary<string, string> { { "shape", "triangle" }, { "color", "yellow" } },
                                new Dictionary<string, string> { { "shape", "star" }, { "color", "green" } },
                                new Dictionary<string, string> { { "shape", "heart" }, { "color", "purple" } },
                                new Dictionary<string, string> { { "shape", "diamond" }, { "color", "orange" } },
                                new Dictionary<string, string> { { "shape", "pentagon" }, { "color", "pink" } },
                                new Dictionary<string, string> { { "shape", "hexagon" }, { "color", "cyan" } },
                            };
                            break;
                        case "5x4":
                            shapeColors = new List<Dictionary<string, string>>
                            {
                                new Dictionary<string, string> { { "shape", "circle" }, { "color", "red" } },
                                new Dictionary<string, string> { { "shape", "square" }, { "color", "blue" } },
                                new Dictionary<string, string> { { "shape", "triangle" }, { "color", "yellow" } },
                                new Dictionary<string, string> { { "shape", "star" }, { "color", "green" } },
                                new Dictionary<string, string> { { "shape", "heart" }, { "color", "purple" } },
                                new Dictionary<string, string> { { "shape", "diamond" }, { "color", "orange" } },
                                new Dictionary<string, string> { { "shape", "pentagon" }, { "color", "pink" } },
                                new Dictionary<string, string> { { "shape", "hexagon" }, { "color", "cyan" } },
                                new Dictionary<string, string> { { "shape", "octagon" }, { "color", "magenta" } },
                                new Dictionary<string, string> { { "shape", "cross" }, { "color", "lime" } },
                            };
                            break;
                        case "6x6":
                            shapeColors = new List<Dictionary<string, string>>
                            {
                                new Dictionary<string, string> { { "shape", "circle" }, { "color", "red" } },
                                new Dictionary<string, string> { { "shape", "square" }, { "color", "blue" } },
                                new Dictionary<string, string> { { "shape", "triangle" }, { "color", "yellow" } },
                                new Dictionary<string, string> { { "shape", "star" }, { "color", "green" } },
                                new Dictionary<string, string> { { "shape", "heart" }, { "color", "purple" } },
                                new Dictionary<string, string> { { "shape", "diamond" }, { "color", "orange" } },
                                new Dictionary<string, string> { { "shape", "pentagon" }, { "color", "pink" } },
                                new Dictionary<string, string> { { "shape", "hexagon" }, { "color", "cyan" } },
                                new Dictionary<string, string> { { "shape", "octagon" }, { "color", "magenta" } },
                                new Dictionary<string, string> { { "shape", "cross" }, { "color", "lime" } },
                                new Dictionary<string, string> { { "shape", "arrow" }, { "color", "teal" } },
                                new Dictionary<string, string> { { "shape", "moon" }, { "color", "silver" } },
                                new Dictionary<string, string> { { "shape", "cloud" }, { "color", "white" } },
                                new Dictionary<string, string> { { "shape", "sun" }, { "color", "gold" } },
                                new Dictionary<string, string> { { "shape", "tree" }, { "color", "forestgreen" } },
                                new Dictionary<string, string> { { "shape", "flower" }, { "color", "violet" } },
                                new Dictionary<string, string> { { "shape", "wave" }, { "color", "navy" } },
                                new Dictionary<string, string> { { "shape", "spiral" }, { "color", "coral" } },
                            };
                            break;
                        default:
                            shapeColors = new List<Dictionary<string, string>>
                            {
                                new Dictionary<string, string> { { "shape", "circle" }, { "color", "red" } },
                                new Dictionary<string, string> { { "shape", "square" }, { "color", "blue" } },
                                new Dictionary<string, string> { { "shape", "triangle" }, { "color", "yellow" } },
                                new Dictionary<string, string> { { "shape", "star" }, { "color", "green" } },
                                new Dictionary<string, string> { { "shape", "heart" }, { "color", "purple" } },
                                new Dictionary<string, string> { { "shape", "diamond" }, { "color", "orange" } },
                                new Dictionary<string, string> { { "shape", "pentagon" }, { "color", "pink" } },
                                new Dictionary<string, string> { { "shape", "hexagon" }, { "color", "cyan" } },
                            };
                            break;
                    }
                    var duplicatedShapeColors = shapeColors.Concat(shapeColors).ToList();
                    duplicatedShapeColors = duplicatedShapeColors.OrderBy(x => Guid.NewGuid()).ToList();
                    gameState = System.Text.Json.JsonSerializer.Serialize(duplicatedShapeColors);
                }
                else if (gameId == 10)
                {
                    gameState = System.Text.Json.JsonSerializer.Serialize(new { message = "Battleship game started" });
                }
                else if (gameId == 11)
                {
                    var inviteId = int.Parse(sessionId.Split('_')[1]);
                    var invite = await _gameInviteService.GetInviteByIdAsync(inviteId);
                    if (invite == null || invite.ToStudentId == null)
                    {
                        Console.WriteLine($"[StartGame] Error: InviteId {inviteId} not found or ToStudentId is null.");
                        await Clients.Caller.SendAsync("InviteError", new { Message = "Davet bilgileri alınamadı." });
                        return;
                    }

                    var inviteeId = invite.ToStudentId;
                    var inviterId = _pendingInvites[sessionId].InviterId;

                    var chessState = new ChessGameState
                    {
                        CurrentPlayer = "white",
                        PlayerColors = new Dictionary<int, string>()
                    };

                    string inviterColor = "white";
                    string inviteeColor = "black";

                    if (initialGameState != null)
                    {
                        var parsedState = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(initialGameState);
                        inviterColor = parsedState["playerColor"];
                        inviteeColor = parsedState["opponentColor"];
                    }

                    chessState.PlayerColors[inviterId] = inviterColor;
                    chessState.PlayerColors[inviteeId] = inviteeColor;

                    _chessGameStates[sessionId] = chessState;

                    var connectionIdToStudentId = new Dictionary<string, int>
                    {
                        { Context.ConnectionId, inviterId }
                    };

                    foreach (var connId in connectionIds)
                    {
                        if (connId != Context.ConnectionId)
                        {
                            connectionIdToStudentId[connId] = inviteeId;
                        }
                    }

                    foreach (var connId in connectionIds)
                    {
                        var studentIdForConn = connectionIdToStudentId[connId];
                        var playerColor = chessState.PlayerColors[studentIdForConn];
                        var opponentColor = playerColor == "white" ? "black" : "white";

                        var clientGameState = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            playerColor,
                            opponentColor
                        });

                        await Clients.Client(connId).SendAsync("GameStarted", new
                        {
                            StudentId = studentIdForConn,
                            GameId = gameId,
                            SessionId = sessionId,
                            InitialGameState = clientGameState,
                            Difficulty = difficulty
                        });

                        Console.WriteLine($"[StartGame] InitialGameState sent to {connId}: {clientGameState}");
                    }

                    await Clients.Group(sessionId).SendAsync("SystemMessage", new
                    {
                        Message = "The game has started, good luck!"
                    });

                    await Clients.Group(sessionId).SendAsync("TurnUpdate", new
                    {
                        CurrentPlayer = chessState.CurrentPlayer,
                        SessionId = sessionId
                    });

                    Console.WriteLine($"Game started for session {sessionId} with gameId {gameId}, difficulty {difficulty}, CurrentPlayer: {chessState.CurrentPlayer}");
                    _pendingInvites.Remove(sessionId);
                    return;
                }

                await Clients.Group(sessionId).SendAsync("GameStarted", new
                {
                    StudentId = studentId,
                    GameId = gameId,
                    SessionId = sessionId,
                    InitialGameState = gameState,
                    Difficulty = difficulty
                });

                await Clients.Group(sessionId).SendAsync("SystemMessage", new
                {
                    Message = "The game has started, good luck!"
                });

                if (gameId == 5)
                {
                    if (string.IsNullOrEmpty(topic))
                    {
                        Console.WriteLine($"[StartGame] Error: Topic is null or empty for quiz game.");
                        await Clients.Caller.SendAsync("InviteError", new { Message = "Konu seçilmedi. Lütfen bir konu seçin." });
                        return;
                    }
                    await StartQuiz(studentId, sessionId, topic);
                }

                Console.WriteLine($"Game started for session {sessionId} with gameId {gameId}, difficulty {difficulty}, topic: {topic}");
                _pendingInvites.Remove(sessionId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[StartGame] Error: {ex.Message}");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Oyun başlatılırken sunucu hatası oluştu." });
            }
        }

        public async Task UnlockBlur(int studentId)
        {
            if (_gameSessions.TryGetValue(Context.ConnectionId, out var sessionId))
            {
                await Clients.GroupExcept(sessionId, Context.ConnectionId).SendAsync("BlurUnlocked", new
                {
                    StudentId = studentId
                });

                await Clients.Group(sessionId).SendAsync("SystemMessage", new
                {
                    Message = $"{studentId} blur kilidini açtı, dikkatli ol!"
                });
            }
            else
            {
                await Clients.Caller.SendAsync("InviteError", new { Message = "No active game session found." });
            }
        }

        public async Task CancelSession(int studentId, string sessionId)
        {
            if (_pendingInvites.ContainsKey(sessionId) && _pendingInvites[sessionId].InviterId == studentId)
            {
                var connectionIds = _pendingInvites[sessionId].ConnectionIds;
                await Clients.Group(sessionId).SendAsync("InviteExpired", new
                {
                    Message = "The game session was cancelled by the inviter."
                });
                _pendingInvites.Remove(sessionId);
                _battleshipStates.TryRemove(sessionId, out _);
                Console.WriteLine($"Session {sessionId} cancelled by inviter {studentId}");
            }
        }

        public async Task JoinGame(int studentId, int gameId)
        {
            string sessionId = $"{gameId}_{Guid.NewGuid()}";
            _gameSessions[Context.ConnectionId] = sessionId;

            await Groups.AddToGroupAsync(Context.ConnectionId, sessionId);
            await Clients.Group(sessionId).SendAsync("GameStarted", new
            {
                StudentId = studentId,
                SessionId = sessionId
            });
        }

        public async Task SendMove(int studentId, int gameId, string moveData)
        {
            try
            {
                if (string.IsNullOrEmpty(moveData))
                {
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Invalid move data." });
                    return;
                }

                if (!_gameSessions.TryGetValue(Context.ConnectionId, out var sessionId))
                {
                    await Clients.Caller.SendAsync("InviteError", new { Message = "No active game session found." });
                    return;
                }

                try
                {
                    var move = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(moveData);
                    if (!move.ContainsKey("type"))
                    {
                        await Clients.Caller.SendAsync("InviteError", new { Message = "Move type is missing." });
                        return;
                    }

                    if (gameId == 10 && move["type"].ToString() == "ready")
                    {
                        if (move.ContainsKey("ships"))
                        {
                            var shipsData = System.Text.Json.JsonSerializer.Deserialize<List<Dictionary<string, object>>>(move["ships"].ToString());
                            if (_battleshipStates.TryGetValue(sessionId, out var sessionState) && sessionState.ContainsKey(studentId))
                            {
                                var playerState = sessionState[studentId];
                                playerState.Ships.Clear();
                                foreach (var shipData in shipsData)
                                {
                                    var coords = System.Text.Json.JsonSerializer.Deserialize<List<List<int>>>(shipData["coords"].ToString())
                                        .Select(c => (x: c[0], y: c[1])).ToList();
                                    var ship = new Ship
                                    {
                                        Id = shipData["id"].ToString(),
                                        Coordinates = coords,
                                        Size = coords.Count,
                                        Hits = 0
                                    };
                                    playerState.Ships.Add(ship);
                                    foreach (var (x, y) in coords)
                                    {
                                        playerState.Grid[x, y] = 1;
                                    }
                                }
                                Console.WriteLine($"[SendMove] Player {studentId} placed ships: {System.Text.Json.JsonSerializer.Serialize(shipsData)}");
                            }
                        }

                        await Clients.Group(sessionId).SendAsync("ReceiveMove", new
                        {
                            StudentId = studentId,
                            MoveData = moveData
                        });
                    }
                    else if (gameId == 10 && move["type"].ToString() == "shot")
                    {
                        var xElement = (JsonElement)move["x"];
                        var yElement = (JsonElement)move["y"];
                        int x = xElement.GetInt32();
                        int y = yElement.GetInt32();

                        bool isHit = false;
                        bool isSunk = false;
                        Ship hitShip = null;
                        List<(int x, int y)> sunkShipCoords = null;

                        if (_battleshipStates.TryGetValue(sessionId, out var sessionState))
                        {
                            var opponentId = sessionState.Keys.FirstOrDefault(id => id != studentId);
                            if (opponentId != 0 && sessionState.TryGetValue(opponentId, out var opponentState))
                            {
                                if (opponentState.Grid[x, y] == 1)
                                {
                                    isHit = true;
                                    hitShip = opponentState.Ships.FirstOrDefault(s => s.Coordinates.Any(c => c.x == x && c.y == y));
                                    if (hitShip != null)
                                    {
                                        hitShip.Hits++;
                                        isSunk = hitShip.IsSunk;
                                        if (isSunk)
                                        {
                                            sunkShipCoords = hitShip.Coordinates;
                                            foreach (var coord in hitShip.Coordinates)
                                            {
                                                opponentState.Grid[coord.x, coord.y] = 4;
                                            }
                                            Console.WriteLine($"[SendMove] Ship sunk: {hitShip.Id}, Coordinates: {System.Text.Json.JsonSerializer.Serialize(hitShip.Coordinates)}");
                                        }
                                        else
                                        {
                                            opponentState.Grid[x, y] = 2;
                                        }
                                    }
                                }
                                else
                                {
                                    opponentState.Grid[x, y] = 3;
                                }
                                Console.WriteLine($"[SendMove] Shot: Player {studentId} -> ({x}, {y}), Result: {(isHit ? (isSunk ? "Sunk" : "Hit") : "Miss")}");

                                bool allSunk = opponentState.Ships.All(s => s.IsSunk);
                                if (allSunk)
                                {
                                    await Clients.Group(sessionId).SendAsync("GameEnded", new
                                    {
                                        StudentId = studentId,
                                        IsWinner = true,
                                        Moves = 0,
                                        Difficulty = "default"
                                    });
                                    await Clients.GroupExcept(sessionId, Context.ConnectionId).SendAsync("GameEnded", new
                                    {
                                        StudentId = opponentId,
                                        IsWinner = false,
                                        Moves = 0,
                                        Difficulty = "default"
                                    });
                                    _battleshipStates.TryRemove(sessionId, out _);
                                    Console.WriteLine($"[SendMove] Game ended: Player {studentId} won, all ships sunk.");
                                }
                                else
                                {
                                    await Clients.GroupExcept(sessionId, Context.ConnectionId).SendAsync("ReceiveMove", new
                                    {
                                        StudentId = studentId,
                                        MoveData = System.Text.Json.JsonSerializer.Serialize(new
                                        {
                                            type = "turn",
                                            nextTurnPlayerId = opponentId
                                        })
                                    });
                                }
                            }
                            else
                            {
                                Console.WriteLine($"[SendMove] Opponent not found: studentId={studentId}, sessionId={sessionId}");
                            }
                        }
                        else
                        {
                            Console.WriteLine($"[SendMove] Game state not found: sessionId={sessionId}");
                        }

                        await Clients.Client(Context.ConnectionId).SendAsync("ReceiveMove", new
                        {
                            StudentId = studentId,
                            MoveData = System.Text.Json.JsonSerializer.Serialize(new
                            {
                                type = "shotResult",
                                x,
                                y,
                                isHit,
                                isSunk,
                                playerId = studentId,
                                sunkShipCoords = isSunk ? sunkShipCoords.Select(c => new { x = c.x, y = c.y }).ToList() : null
                            })
                        });

                        await Clients.GroupExcept(sessionId, Context.ConnectionId).SendAsync("ReceiveMove", new
                        {
                            StudentId = studentId,
                            MoveData = System.Text.Json.JsonSerializer.Serialize(new
                            {
                                type = "shot",
                                x,
                                y,
                                playerId = studentId
                            })
                        });
                    }
                    else if (gameId == 11)
                    {
                        if (!_chessGameStates.TryGetValue(sessionId, out var chessState))
                        {
                            await Clients.Caller.SendAsync("InviteError", new { Message = "Chess game state not found." });
                            return;
                        }

                        if (!chessState.PlayerColors.TryGetValue(studentId, out var playerColor))
                        {
                            await Clients.Caller.SendAsync("InviteError", new { Message = "Player color not assigned." });
                            return;
                        }

                        if (chessState.CurrentPlayer != playerColor)
                        {
                            await Clients.Caller.SendAsync("InviteError", new { Message = "It's not your turn." });
                            return;
                        }

                        var nextPlayer = chessState.CurrentPlayer == "white" ? "black" : "white";
                        chessState.CurrentPlayer = nextPlayer;
                        _chessGameStates[sessionId] = chessState;

                        await Clients.Group(sessionId).SendAsync("ReceiveMove", new
                        {
                            StudentId = studentId,
                            MoveData = moveData,
                            CurrentPlayer = nextPlayer,
                            SessionId = sessionId
                        });

                        Console.WriteLine($"[SendMove] Chess move processed. StudentId: {studentId}, SessionId: {sessionId}, New CurrentPlayer: {chessState.CurrentPlayer}");

                        await _gameService.SaveGameProgressAsync(studentId, gameId, moveData);
                        return;
                    }
                    else
                    {
                        await Clients.Group(sessionId).SendAsync("ReceiveMove", new
                        {
                            StudentId = studentId,
                            MoveData = moveData
                        });
                    }

                    await _gameService.SaveGameProgressAsync(studentId, gameId, moveData);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[SendMove] Error parsing move: {ex.Message}");
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Invalid move data format." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SendMove] Error: {ex.Message}");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Failed to send move." });
            }
        }

        public async Task SendMessage(int studentId, string message)
        {
            try
            {
                if (string.IsNullOrEmpty(message))
                {
                    await Clients.Caller.SendAsync("InviteError", new { Message = "Chat message is empty." });
                    return;
                }

                if (_gameSessions.TryGetValue(Context.ConnectionId, out var sessionId))
                {
                    await Clients.Group(sessionId).SendAsync("MessageData", new
                    {
                        StudentId = studentId,
                        Message = message
                    });
                }
                else
                {
                    await Clients.Caller.SendAsync("InviteError", new { Message = "No active game session found." });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SendMessage] Error: {ex.Message}");
                await Clients.Caller.SendAsync("InviteError", new { Message = "Failed to send message." });
            }
        }

        public async Task EndGame(int studentId, int gameId, bool isWinner, int moves, string difficulty)
        {
            if (_gameSessions.TryGetValue(Context.ConnectionId, out var sessionId))
            {
                await Clients.Group(sessionId).SendAsync("GameEnded", new
                {
                    StudentId = studentId,
                    IsWinner = isWinner,
                    Moves = moves,
                    Difficulty = difficulty
                });

                _gameSessions.Remove(Context.ConnectionId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, sessionId);
                _battleshipStates.TryRemove(sessionId, out _);
                _chessGameStates.TryRemove(sessionId, out _);
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            if (_gameSessions.TryGetValue(Context.ConnectionId, out var sessionId))
            {
                string studentId = Context.UserIdentifier;
                Console.WriteLine($"[OnDisconnectedAsync] Player {studentId} disconnected from session {sessionId}");

                if (_quizSessions.TryGetValue(sessionId, out var state) && state.IsQuestionActive)
                {
                    state.IsQuestionActive = false;
                    var questionIndex = state.CurrentQuestionIndex;
                    var results = CalculateResults(state, questionIndex);
                    Console.WriteLine($"[OnDisconnectedAsync] Player {studentId} disconnected, ending question {questionIndex} for session {sessionId}");
                    await Clients.Group(sessionId).SendAsync("QuestionEnded", new
                    {
                        SessionId = sessionId,
                        QuestionIndex = questionIndex,
                        Results = results
                    });
                }

                await Clients.GroupExcept(sessionId, Context.ConnectionId).SendAsync("PlayerDisconnected", new
                {
                    StudentId = studentId,
                    Message = $"{studentId} kişinin bağlantısı koptu, oyun sonlandırılıyor."
                });

                var sessionConnections = _gameSessions.Where(kvp => kvp.Value == sessionId).Select(kvp => kvp.Key).ToList();
                foreach (var connId in sessionConnections)
                {
                    _gameSessions.Remove(connId);
                    try
                    {
                        await Groups.RemoveFromGroupAsync(connId, sessionId);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[OnDisconnectedAsync] Group removal failed for {connId}: {ex.Message}");
                    }
                }

                _battleshipStates.TryRemove(sessionId, out _);
                _chessGameStates.TryRemove(sessionId, out _);
                Console.WriteLine($"[OnDisconnectedAsync] Session {sessionId} cleaned up.");
            }

            foreach (var invite in _pendingInvites.ToList())
            {
                if (invite.Value.ConnectionIds.Contains(Context.ConnectionId))
                {
                    var senderConnectionId = invite.Value.ConnectionIds[0];
                    await Clients.Client(senderConnectionId).SendAsync("InviteExpired", new
                    {
                        Message = $"Davet iptal edildi. Oyuncu {Context.UserIdentifier} bağlantıyı kesti."
                    });
                    _pendingInvites.Remove(invite.Key);
                    break;
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        //public async Task CheckInviteTimeouts()
        //{
        //    var currentTime = DateTime.Now;

        //    foreach (var invite in _pendingInvites.ToList())
        //    {
        //        if ((currentTime - invite.Value.InviteSentTime).TotalSeconds > 30)
        //        {
        //            var sessionId = invite.Key;
        //            var senderConnectionId = invite.Value.ConnectionIds[0];

        //            var parts = sessionId.Split('_');
        //            if (parts.Length == 2 && int.TryParse(parts[1], out int inviteId))
        //            {
        //                try
        //                {
        //                    await _gameInviteService.CancelInviteAsync(inviteId);
        //                    Console.WriteLine($"[CheckInviteTimeouts] InviteId {inviteId} cancelled due to timeout.");
        //                }
        //                catch (Exception ex)
        //                {
        //                    Console.WriteLine($"[CheckInviteTimeouts] Error canceling inviteId {inviteId}: {ex.Message}");
        //                }
        //            }

        //            await Clients.Client(senderConnectionId).SendAsync("InviteExpired", new
        //            {
        //                Message = "Davet süresi doldu!"
        //            });

        //            _pendingInvites.Remove(sessionId);
        //            _battleshipStates.TryRemove(sessionId, out _);
        //        }
        //    }

        //    await Task.Delay(5000);
        //    await CheckInviteTimeouts();
        //}
    }
}