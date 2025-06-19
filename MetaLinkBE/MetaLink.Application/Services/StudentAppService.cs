using System.Runtime.CompilerServices;
using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Application.DTOs;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace Metalink.Application.AppServices
{
    public class StudentAppService : IStudentAppService
    {
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly IStudentService _studentDomainService;
        private readonly IAvatarService _avatarService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IAIGeneratedContentService _aIGeneratedContentService;
        private readonly IStudentTestStatisticService _studentTestStatisticService;
        private readonly IExamAppService _examAppService;
        private readonly ITestService _testService;
        private readonly ITestQuestionService _questionService;
        private readonly ITestQuestionOptionService _questionOptionService;
        private readonly ITestAnswerService _answerService;
        private readonly ILearningStyleAnswerService _learningStyleAnswerService;
        private readonly IXPService _xPService;
        private readonly ISubLessonProgressService _subLessonProgressService;
        private readonly IStudentFriendshipService _studentFriendshipService;
        private readonly IQuizService _quizService;
        private readonly IQuizQuestionService _quizQuestionService;
        private readonly IQuizQuestionOptionService _quizQuestionOptionService;
        private readonly IQuizAnswerService _quizAnswerService;
        private readonly IMessageService _messageService;
        private readonly ILessonProgressService _lessonProgressService;
        private readonly IGameProgressRepository _gameProgressRepository;
        private readonly IGameInviteService _gameInviteService;
        private readonly ICourseProgressService _courseProgressService;
        private readonly IChatMessageService _chatMessageService;
        private readonly ICourseAppService _courseAppService;
        private readonly ISubLessonService _subLessonService;
        private readonly ILessonService _lessonService;
        private readonly IAiPromptService _aiPromptService;
        private readonly IChatGptService _chatGptService;
        private readonly IStudentReportService _studentReportService;
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;
        private readonly IReviewSessionService _reviewSessionService;

        public StudentAppService(
            IConfiguration config,
            IMapper mapper, 
            IStudentService studentDomainService, 
            IAvatarService avatarService, 
            IWebHostEnvironment webHostEnvironment, 
            IAIGeneratedContentService aIGeneratedContentService, 
            IStudentTestStatisticService studentTestStatisticService, 
            IExamAppService examAppService, 
            ITestService testService, 
            ITestQuestionService questionService, 
            ITestQuestionOptionService questionOptionService, 
            ITestAnswerService answerService,
            ILearningStyleAnswerService learningStyleAnswerService,
            IXPService xPService,
            ISubLessonProgressService subLessonProgressService,
            IStudentFriendshipService studentFriendshipService,
            IQuizService quizService,
            IQuizQuestionService quizQuestionService,
            IQuizQuestionOptionService quizQuestionOptionService,
            IQuizAnswerService quizAnswerService,
            IMessageService messageService,
            ILessonProgressService lessonProgressService,
            IGameProgressRepository gameProgressRepository,
            IGameInviteService gameInviteService,
            ICourseProgressService courseProgressService,
            IChatMessageService chatMessageService,
            ICourseAppService courseAppService,
            ISubLessonService subLessonService,
            ILessonService lessonService,
            IAiPromptService aiPromptService,
            IChatGptService chatGptService,
            IStudentReportService studentReportService,
            IEmailService emailService,
            IUserService userService,
            IReviewSessionService reviewSessionService)
        {
            _config = config;
            _mapper = mapper;
            _studentDomainService = studentDomainService;
            _avatarService = avatarService;
            _webHostEnvironment = webHostEnvironment;
            _aIGeneratedContentService = aIGeneratedContentService;
            _studentTestStatisticService = studentTestStatisticService;
            _examAppService = examAppService;
            _testService = testService;
            _questionService = questionService;
            _questionOptionService = questionOptionService;
            _answerService = answerService;
            _learningStyleAnswerService = learningStyleAnswerService;
            _xPService = xPService;
            _subLessonProgressService = subLessonProgressService;
            _studentFriendshipService = studentFriendshipService;
            _quizService = quizService;
            _quizQuestionService = quizQuestionService;
            _quizQuestionOptionService = quizQuestionOptionService;
            _quizAnswerService = quizAnswerService;
            _messageService = messageService;
            _lessonProgressService = lessonProgressService;
            _gameProgressRepository = gameProgressRepository;
            _gameInviteService = gameInviteService;
            _courseProgressService = courseProgressService;
            _chatMessageService = chatMessageService;
            _courseAppService = courseAppService;
            _subLessonService = subLessonService;
            _lessonService = lessonService;
            _aiPromptService = aiPromptService;
            _chatGptService = chatGptService;
            _studentReportService = studentReportService;
            _emailService = emailService;
            _userService = userService;
            _reviewSessionService = reviewSessionService;
        }

        public async Task<StudentDTO> AddStudentAsync(int userId, CreateStudentRequest request)
        {
            var student = new Student
            {
                UserID = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                DateOfBirth = request.DateOfBirth,
                Class = request.Class,
                Role = "Student",
                CreateDate = DateTime.UtcNow,
                UpdateDate = DateTime.UtcNow,
                SelectedAvatarID = 1,
                ThemeChoice = 1,
                Gender = request.Gender,
                LearningStyleCompleated = false,
                VoiceType = VoiceTypeEnum.Nova,
                GameLevel = 0,
            };

            var createdStudent = await _studentDomainService.CreateStudentAsync(student);
            return _mapper.Map<StudentDTO>(createdStudent);
        }

        public async Task<List<StudentDTO>> GetStudentsByUserIdAsync(int userId)
        {
            var students = await _studentDomainService.GetStudentsByUserIdAsync(userId);
            return _mapper.Map<List<StudentDTO>>(students);
        }

        public async Task<StudentDTO> UpdateStudentAsync(int userId, int studentId, UpdateStudentRequest request)
        {
            var student = await _studentDomainService.GetByIdAsync(studentId);
            if (student == null || student.UserID != userId)
            {
                throw new Exception("Student not found or unauthorized");
            }
            // Update student properties
            student.FirstName = request.FirstName;
            student.LastName = request.LastName;
            student.DateOfBirth = request.DateOfBirth;
            student.Class = request.Class;
            student.Gender = request.Gender;
            student.UpdateDate = DateTime.UtcNow;

            var updatedStudent = await _studentDomainService.UpdateStudentAsync(student);
            return _mapper.Map<StudentDTO>(updatedStudent);
        }

        public async Task<StudentDTO> UpdateThemeChoiceAsync(int studentId, UpdateThemeChoiceRequest request)
        {
            var updatedStudent = await _studentDomainService.UpdateThemeChoiceAsync(studentId, request.ThemeChoice);
            return _mapper.Map<StudentDTO>(updatedStudent);
        }

        public async Task DeleteStudentAsync(int userId, int studentId)
        {
            var student = await _studentDomainService.GetByIdAsync(studentId);
            if (student == null || student.UserID != userId)
                throw new Exception("Student not found or unauthorized");

            var allContent = await _aIGeneratedContentService.GetAllAIGeneratedContentAsync() ?? new List<AIGeneratedContent>();
            var aiGeneretedContent = allContent.Where(ai => ai.StudentID == studentId).ToList();

            var tests = (await _testService.GetAllTestAsync())?.Where(t => t.StudentId == studentId).ToList() ?? new();
            var testQuestions = await _questionService.GetAllTestQuestionsAsync() ?? new List<TestQuestion>();
            var testQuestionOptions = await _questionOptionService.GetAllTestQuestionOptionsAsync() ?? new List<TestQuestionOption>();

            var testAnswers = (await _answerService.GetAllTestAnswersAsync())?.Where(ta => ta.StudentID == studentId).ToList() ?? new();

            var quizes = await _quizService.GetAllQuizzesByStudentIdAsync(studentId) ?? new List<Quiz>();
            var quiztQuestions = await _quizQuestionService.GetAllQuizQuestionsAsync() ?? new List<QuizQuestion>();
            var quizQuestionOptions = await _quizQuestionOptionService.GetAllQuizQuestionOptionsAsync() ?? new List<QuizQuestionOption>();

            var accepteFriends = await _studentFriendshipService.GetFriendsAsync(studentId) ?? new List<StudentFriendship>();
            var blockedFriends = await _studentFriendshipService.GetBlockedUsersAsync(studentId) ?? new List<StudentFriendship>();
            var pendingFriends = await _studentFriendshipService.GetPendingRequestsAsync(studentId) ?? new List<StudentFriendship>();

            var quizAnswers = (await _quizAnswerService.GetAllQuizAnswersAsync())?.Where(qa => qa.StudentID == studentId).ToList() ?? new();

            var learningStyleAnswers = (await _learningStyleAnswerService.GetAllAsync())?.Where(ls => ls.StudentID == studentId).ToList() ?? new();

            var xpRecords = await _xPService.GetXPRecordsAsync(studentId) ?? new();

            var sublessonProgress = (await _subLessonProgressService.GetAllSubLessonProgressesAsync())?.Where(slp => slp.StudentID == studentId).ToList() ?? new();
            var lessonProgress = (await _lessonProgressService.GetAllLessonProgressesAsync())?.Where(lp => lp.StudentID == studentId).ToList() ?? new();
            var courseProgress = (await _courseProgressService.GetAllCourseProgressesAsync())?.Where(cp => cp.StudentID == studentId).ToList() ?? new();

            var studentTestStatistic = await _studentTestStatisticService.GetStatisticByStudentAsync(studentId) ?? new();

            var messages = (await _messageService.GetAllMessages())?.Where(m => m.SenderStudentId == studentId || m.ReceiverStudentId == studentId).ToList() ?? new();

            var gameProgress = await _gameProgressRepository.GetByStudentIdAsync(studentId) ?? new();

            var gameInvite = await _gameInviteService.GetAllInvite() ?? new();
            var filteredGameInvite = gameInvite.Where(gi => gi.FromStudentId == studentId || gi.ToStudentId == studentId).ToList();

            var chatMessage = (await _chatMessageService.GetAllChatMessageAsync())?.Where(cm => cm.StudentID == studentId).ToList() ?? new();

            var allStudentReport = await _studentReportService.GetStudentReportByStudentIdAsync(studentId);

            var reviewSessions = (await _reviewSessionService.GetReviewSessionByStudentIdAsync(studentId)).ToList();

            foreach (var tAnswer in testAnswers)
                await _answerService.DeleteTestAnswerAsync(tAnswer.TestAnswerID);

            foreach (var test in tests)
            {
                var filteredTestQuestions = testQuestions.Where(q => q.TestID == test.TestID).ToList();

                foreach (var question in filteredTestQuestions)
                {
                    var filteredTestQuestionOptions = testQuestionOptions.Where(qo => qo.QuestionID == question.QuestionID).ToList();
                    foreach (var qO in filteredTestQuestionOptions)
                        await _questionOptionService.DeleteTestQuestionOptionAsync(qO.OptionID);

                    await _questionService.DeleteTestQuestionAsync(question.QuestionID);
                }

                await _testService.DeleteTestAsync(test.TestID);
            }

            foreach (var qAnswer in quizAnswers)
                await _quizAnswerService.DeleteQuizAnswerAsync(qAnswer.QuizAnswerID);

            foreach (var quiz in quizes)
            {
                var filteredQuizQuestions = quiztQuestions.Where(q => q.QuizID == quiz.QuizID).ToList();

                foreach (var question in filteredQuizQuestions)
                {
                    var filteredQuizQuestionOptions = quizQuestionOptions.Where(qo => qo.QuestionID == question.QuestionID).ToList();
                    foreach (var qO in filteredQuizQuestionOptions)
                        await _quizQuestionOptionService.DeleteQuizQuestionOptionAsync(qO.OptionID);

                    await _quizQuestionService.DeleteQuizQuestionAsync(question.QuestionID);
                }

                await _quizService.DeleteQuizAsync(quiz.QuizID);
            }

            foreach (var answer in learningStyleAnswers)
                await _learningStyleAnswerService.DeleteAsync(answer.ID);

            foreach (var record in xpRecords)
                await _xPService.DeleteAsync(record.Id);

            foreach (var slp in sublessonProgress)
                await _subLessonProgressService.DeleteSubLessonProgressAsync(slp.ProgressID);

            foreach (var lp in lessonProgress)
                await _lessonProgressService.DeleteLessonProgressAsync(lp.ProgressID);

            foreach (var cp in courseProgress)
                await _courseProgressService.DeleteCourseProgressAsync(cp.ProgressID);

            foreach (var sTestStat in studentTestStatistic)
                await _studentTestStatisticService.DeleteStatisticAsync(sTestStat.ID);

            foreach (var message in messages)
                await _messageService.DeleteAsync(message.Id);

            foreach (var friend in accepteFriends)
                await _studentFriendshipService.DeleteFriendshipAsync(friend.Id, studentId);
            foreach (var friend in blockedFriends)
                await _studentFriendshipService.DeleteFriendshipAsync(friend.Id, studentId);
            foreach (var friend in pendingFriends)
                await _studentFriendshipService.DeleteFriendshipAsync(friend.Id, studentId);

            foreach (var gp in gameProgress)
                await _gameProgressRepository.DeleteAsync(gp.Id);

            foreach (var gI in filteredGameInvite)
                await _gameInviteService.DeleteInvite(gI.Id);

            foreach (var cM in chatMessage)
                await _chatMessageService.DeleteChatMessageAsync(cM.ChatMessageID);

            foreach (var content in aiGeneretedContent)
                await _aIGeneratedContentService.DeleteAIGeneratedContentAsync(content.ContentID);

            foreach (var report in allStudentReport)
            {
                await _studentReportService.DeleteStudentReportAsync(report.Id);
            }

            foreach (var rS in reviewSessions)
            {
                await _reviewSessionService.DeleteReviewSessionAsync(rS.ReviewSessionId);
            }

            await _studentDomainService.DeleteStudentAsync(student);
        }

        public async Task<StudentInformationResponse> GetStudentByStudentIdAsync(int studentId)
        {
            var student = await _studentDomainService.GetByIdAsync(studentId);

            if (student == null)
                throw new ArgumentNullException("Student not found!");

            AvatarChatTypeEnum avatarChatType = student.VoiceType switch
            {
                VoiceTypeEnum.Nova or VoiceTypeEnum.Coral or VoiceTypeEnum.Shimmer or VoiceTypeEnum.Verse
                    => AvatarChatTypeEnum.WomanAvatar,

                VoiceTypeEnum.Onyx or VoiceTypeEnum.Sage or VoiceTypeEnum.Ash
                    => AvatarChatTypeEnum.ManAvatar,

                _ => AvatarChatTypeEnum.RobotAvatar
            };

            return new StudentInformationResponse
            {
                Class = student.Class,
                DateOfBirth = student.DateOfBirth,
                FirstName = student.FirstName,
                Gender = student.Gender,
                LastName = student.LastName,
                SelectedAvatarID = student.SelectedAvatarID ?? 1,
                ThemeChoice = student.ThemeChoice ?? 1,
                Role = student.Role,
                StudentID = student.StudentID,
                GameLevel = student.GameLevel ?? 0,
                AvatarChatType = avatarChatType,
                VoiceType = student.VoiceType ?? VoiceTypeEnum.Nova
            };
        }

        public async Task<bool> UpdateSelectedAvatarByStudentId(int studentId, int avatarId)
        {
            var student = await _studentDomainService.GetByIdAsync(studentId);

            if (student == null) throw new ArgumentNullException("Student not found!");

            var avatar = await _avatarService.GetAvatarByIdAsync(avatarId);
            if (avatar == null) throw new ArgumentNullException("Avatar bulunamadı!");

            student.SelectedAvatarID = avatarId;

            await _studentDomainService.UpdateStudentAsync(student);

            return true;
        }

        public async Task<List<AvatarDTO>> GetAllAvatars()
        {
            var avatars = await _avatarService.GetAllAvatarAsync();

            var avatarDTOs = _mapper.Map<List<AvatarDTO>>(avatars);

            // wwwroot/avatars klasöründeki tüm dosyaları listele
            string avatarDirectory = Path.Combine(_webHostEnvironment.WebRootPath, "avatars");
            var avatarFiles = Directory.GetFiles(avatarDirectory)
                                       .Select(Path.GetFileName)
                                       .ToList();

            foreach (var avatar in avatarDTOs)
            {
                string matchedFile = avatarFiles.FirstOrDefault(f =>
                    Path.GetFileNameWithoutExtension(f).Equals(avatar.AvatarName, StringComparison.OrdinalIgnoreCase));

                if (!string.IsNullOrEmpty(matchedFile))
                {
                    avatar.AvatarPath = $"/avatars/{matchedFile}";
                }
            }

            return avatarDTOs;
        }

        public async Task<bool> UpdateVoiceTypeAsync(int studentId, VoiceTypeEnum voiceType)
        {
            if (studentId == null || studentId == 0)
                throw new ArgumentException("StudentId not found!", nameof(studentId));

            if (!Enum.IsDefined(typeof(VoiceTypeEnum), voiceType))
                throw new ArgumentException("Geçersiz ses tipi.", nameof(voiceType));

            var student = await _studentDomainService.GetByIdAsync(studentId);
            if (student == null)
                throw new InvalidOperationException("Öğrenci bulunamadı.");

            student.VoiceType = voiceType;
            await _studentDomainService.UpdateStudentAsync(student);

            return true;
        }

        public async Task<StudentStatisticsResponse> GetStudentStatisticByStudentId(int studentId)
        {
            var student = await _studentDomainService.GetByIdAsync(studentId);
            if (student == null) throw new ArgumentException("Student not found!", nameof(studentId));

            var studentTestStat = await _studentTestStatisticService.GetStatisticByStudentAsync(studentId);
            var testProcessResponse = await _examAppService.GetAllTestProcessByStudentId(studentId);
            var courseProgress = await _courseAppService.GetCourseProgressByStudentId(studentId);
            var allSublessons = await _subLessonService.GetAllSubLessonAsync();
            var allLessons = await _lessonService.GetAllLessonAsync();

            var newStudentTestStatisticResponse = new List<StudentTestStatisticResponse>();

            foreach (var testStat in studentTestStat)
            {
                var responseItem = new StudentTestStatisticResponse
                {
                    ID = testStat.ID,
                    StudentID = testStat.StudentID,
                    TestID = testStat.TestID,
                    QuizID = testStat.QuizID,
                    TestType = testStat.TestType,
                    QuizType = testStat.QuizType,
                    TotalQuestions = testStat.TotalQuestions,
                    CorrectAnswers = testStat.CorrectAnswers,
                    WrongAnswers = testStat.WrongAnswers,
                    DurationInMilliseconds = testStat.DurationInMilliseconds,
                    TestDate = testStat.TestDate
                };

                if (testStat.TestID != null && testStat.TestID != 0)
                {
                    var test = await _testService.GetTestByIdAsync(testStat.TestID.Value);
                    var sublesson = allSublessons.FirstOrDefault(sl => sl.SubLessonID == test.SubLessonID);

                    if (sublesson != null)
                    {
                        responseItem.TestTopic = sublesson.Title;
                    }
                    else
                    {
                        var lesson = allLessons.FirstOrDefault(l => l.LessonID == test.LessonID);
                        responseItem.TestTopic = lesson?.Title;
                    }
                }

                if (testStat.QuizID != null && testStat.QuizID != 0)
                {
                    var quiz = await _quizService.GetQuizByIdAsync(testStat.QuizID.Value);
                    var sublesson = allSublessons.FirstOrDefault(sl => sl.SubLessonID == quiz.SubLessonID);

                    if (sublesson != null)
                    {
                        responseItem.QuizTopic = sublesson.Title;
                    }
                    else
                    {
                        var lesson = allLessons.FirstOrDefault(l => l.LessonID == quiz.LessonID);
                        responseItem.QuizTopic = lesson?.Title;
                    }
                }

                newStudentTestStatisticResponse.Add(responseItem);
            }

            return new StudentStatisticsResponse
            {
                Class = student.Class,
                FirstName = student.FirstName,
                LastName = student.LastName,
                LearningStyleCompleated = student.LearningStyleCompleated,
                LearningStyleType = student.LearningStyleType ?? null,
                SelectedAvatarID = student.SelectedAvatarID,
                StudentID = student.StudentID,
                Statistic = newStudentTestStatisticResponse,
                TestBankProgress = testProcessResponse.CourseProcess,
                CourseProgress = courseProgress,
            };
        }

        public async Task<string> GenerateReportByStudentId(int studentId)
        {
            var student = await _studentDomainService.GetByIdAsync(studentId);
            if (student == null) throw new ArgumentException("Student not found!", nameof(studentId));

            var parent = await _userService.GetByIdAsync(student.UserID);
            if (parent == null) throw new ArgumentException(nameof(parent), "Parent not found!");

            var response = await GetStudentStatisticByStudentId(studentId);

            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 13);
            if (systemPrompt == null)
                throw new Exception("Rapor oluşturmak için prompt (ContentType 13) bulunamadı.");

            var fullName = student.FirstName + " " + student.LastName;
            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
                studentAge--;

            var promptText = systemPrompt.PromptText
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[STUDENT_FULLNAME]", fullName)
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[REPORT_DATA]", System.Text.Json.JsonSerializer.Serialize(response));

            var messages = new List<ChatGptMessage>
            {
                new ChatGptMessage
                {
                    role = "system",
                    content = promptText
                }
            };

            var result = await _chatGptService.SendAiRequestAsync(messages, maxTokens: 4000);

            result = result.Trim();
            if (result.StartsWith("```html"))
                result = result.Substring(7).TrimStart();
            else if (result.StartsWith("```"))
                result = result.Substring(3).TrimStart();

            if (result.EndsWith("```"))
                result = result.Substring(0, result.Length - 3).TrimEnd();

            var newReport = new StudentReport
            {
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "AI",
                ReportText = result,
                StudentId = studentId,
            };

            await _studentReportService.AddStudentReportAsync(newReport);

            var emailMessage = new
            {
                Messages = new[]
                {
                    new
                    {
                        From = new { Email = _config["Mailjet:Email"], Name = "MetaLink" },
                        To = new[] { new { Email = parent.Email, Name = parent.FirstName + " " + parent.LastName } },
                        Subject = "Student Statistics Report " + DateTime.UtcNow.ToString(),
                        HTMLPart = result
                    }
                }
            };

            var messageJson = JsonConvert.SerializeObject(emailMessage);

            await _emailService.SendMessageEmailAsync(messageJson);

            return result;
        }
    }
}
