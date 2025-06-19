using AutoMapper;
using Metalink.Application.Interfaces;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using MetaLink.Application.Requests;
using MetaLink.Domain.Enums;
using Metalink.Domain.Entities;
using MetaLink.Application.Interfaces;

namespace Metalink.Application.AppServices
{
    public class ExamAppService : IExamAppService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly IMapper _mapper;
        private readonly ICourseService _courseService;
        private readonly ILessonService _lessonService;
        private readonly ISubLessonService _subLessonService;
        private readonly IStudentService _studentService;
        private readonly IAiPromptService _aiPromptService;
        private readonly ITestService _testService;
        private readonly IQuizService _quizService;
        private readonly IQuizQuestionService _quizQuestionService;
        private readonly IQuizQuestionOptionService _quizQuestionOptionService;
        private readonly IQuizAnswerService _quizAnswerService;
        private readonly ITestQuestionService _testQuestionService;
        private readonly ITestQuestionOptionService _testQuestionOptionService;
        private readonly ITestAnswerService _testAnswerService;
        private readonly IChatGptService _chatGptService;
        private readonly IChatContextService _chatContextService;
        private readonly IUserService _userService;
        private readonly ICourseProgressService _courseProgressService;
        private readonly ILessonProgressService _lessonProgressService;
        private readonly ISubLessonProgressService _subLessonProgressService;
        private readonly IXPService _xPService;
        private readonly IStudentTestStatisticService _studentTestStatisticService;
        private readonly IReviewSessionService _reviewSessionService;
        private readonly IAIGeneratedContentService _aIGeneratedContentService;

        public ExamAppService(HttpClient httpClient, IConfiguration configuration, IMapper mapper, ICourseService courseService, ILessonService lessonService, ISubLessonService subLessonService, IStudentService studentService, IAiPromptService aiPromptService, ITestService testService, ITestQuestionService testQuestionService, ITestQuestionOptionService testQuestionOptionService, ITestAnswerService testAnswerService, IChatGptService chatGptService, IChatContextService chatContextService, IUserService userService, ICourseProgressService courseProgressService, ILessonProgressService lessonProgressService, ISubLessonProgressService subLessonProgressService, IQuizService quizService, IQuizQuestionService quizQuestionService, IQuizQuestionOptionService quizQuestionOptionService, IQuizAnswerService quizAnswerService, IXPService xPService, IStudentTestStatisticService studentTestStatisticService, IReviewSessionService reviewSessionService, IAIGeneratedContentService aIGeneratedContentService)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OpenAI:ApiKey"];
            _mapper = mapper;
            _courseService = courseService;
            _lessonService = lessonService;
            _subLessonService = subLessonService;
            _studentService = studentService;
            _aiPromptService = aiPromptService;
            _testService = testService;
            _quizService = quizService;
            _quizQuestionService = quizQuestionService;
            _quizQuestionOptionService = quizQuestionOptionService;
            _quizAnswerService = quizAnswerService;
            _testQuestionService = testQuestionService;
            _testQuestionOptionService = testQuestionOptionService;
            _testAnswerService = testAnswerService;
            _chatGptService = chatGptService;
            _chatContextService = chatContextService;
            _userService = userService;
            _courseProgressService = courseProgressService;
            _lessonProgressService = lessonProgressService;
            _subLessonProgressService = subLessonProgressService;
            _xPService = xPService;
            _studentTestStatisticService = studentTestStatisticService;
            _reviewSessionService = reviewSessionService;
            _aIGeneratedContentService = aIGeneratedContentService;
        }

        public async Task<ComparisonResponse> CompareTestAsync(ComparisonRequest req)
        {
            if (!req.TestId.HasValue)
                throw new ArgumentException("TestId is required", nameof(req.TestId));

            var test = await _testService.GetTestByIdAsync(req.TestId.Value)
                       ?? throw new ArgumentException("Test not found", nameof(req.TestId));
            if (!test.SubLessonID.HasValue)
                throw new InvalidOperationException("Test not linked to a SubLesson");

            var allStats = await _studentTestStatisticService.GetBySubLessonIdAsync(test.SubLessonID.Value);
            if (!allStats.Any())
                throw new InvalidOperationException("No statistics for that sublesson yet");

            var avgCorrect = allStats.Average(s => s.CorrectAnswers);
            var avgWrong = allStats.Average(s => s.WrongAnswers);
            var avgDuration = allStats.Average(s => s.DurationInMilliseconds);

            var mine = allStats.FirstOrDefault(s =>
                s.StudentID == req.StudentId
                && s.TestID == req.TestId.Value);

            if (mine == null)
                throw new ArgumentException("Student has not yet statistics for this test");

            bool success = mine.CorrectAnswers >= 10;

            //review session dedect
            if (!success)
            {
                var reviewSessionList = await _reviewSessionService.GetReviewSessionByStudentIdAsync(req.StudentId);
                var filteredReviewSession = reviewSessionList.Where(rS => rS.SubLessonId == test.SubLessonID.Value).FirstOrDefault();

                if(filteredReviewSession != null)
                {
                    if(filteredReviewSession.ReviewSessionType != ReviewSessionTypeEnum.Test && filteredReviewSession.ReviewSessionType != ReviewSessionTypeEnum.Both)
                    {
                        filteredReviewSession.ReviewSessionType = ReviewSessionTypeEnum.Both;

                        await _reviewSessionService.UpdateReviewSessionAsync(filteredReviewSession);
                    }
                }
                else
                {
                    var newReviewSession = new ReviewSession
                    {
                        StudentId = req.StudentId,
                        SubLessonId = test.SubLessonID.Value,
                        FailCount = 0,
                        ReviewSessionType = ReviewSessionTypeEnum.Test,
                        IsTestSolved = false,
                        IsCompleted = false,
                        CreateDate = DateTime.UtcNow,
                    };

                    await _reviewSessionService.AddReviewSessionAsync(newReviewSession);
                }
            }

            return new ComparisonResponse
            {
                AvgCorrectAnswers = avgCorrect,
                AvgWrongAnswers = avgWrong,
                AvgDurationInMillis = avgDuration,
                StudentCorrectAnswers = mine.CorrectAnswers,
                StudentWrongAnswers = mine.WrongAnswers,
                StudentDurationInMillis = mine.DurationInMilliseconds,
                IsSuccessful = success
            };
        }

        public async Task<List<TestResponse>> GetAllTest(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null) throw new ArgumentException("Student not found!");

            var tests = await _testService.GetAllTestAsync();
            var filteredTests = tests.Where(t => t.StudentId == studentId).ToList();

            var newTestResponseList = new List<TestResponse>();

            foreach (var test in filteredTests)
            {
                var testResponse = new TestResponse
                {
                    TestID = test.TestID,
                    SubLessonID = test.SubLessonID,
                    LessonID = test.LessonID,
                    Title = test.Title,
                    Description = test.Description,
                    CreateDate = test.CreateDate,
                    IsSolved = test.IsSolved,
                    TestType = test.TestType,
                    TestQuestions = null,
                    Status = null,
                };

                newTestResponseList.Add(testResponse);
            }

            return newTestResponseList;
        }

        public async Task<ComparisonResponse> CompareQuizAsync(ComparisonRequest req)
        {
            if (!req.QuizId.HasValue)
                throw new ArgumentException("QuizId is required", nameof(req.QuizId));

            var quiz = await _quizService.GetQuizByIdAsync(req.QuizId.Value)
                       ?? throw new ArgumentException("Quiz not found", nameof(req.QuizId));

            if (!quiz.SubLessonID.HasValue)
                throw new InvalidOperationException("Quiz is not linked to a SubLesson");

            var subLessonId = quiz.SubLessonID.Value;

            var allStats = (await _studentTestStatisticService
                               .GetBySubLessonQuizIdAsync(subLessonId))
                           .ToList();

            if (!allStats.Any())
                throw new InvalidOperationException("No quiz statistics for that SubLesson yet");

            var avgCorrect = allStats.Average(s => s.CorrectAnswers);
            var avgWrong = allStats.Average(s => s.WrongAnswers);
            var avgDuration = allStats.Average(s => s.DurationInMilliseconds);

            var mine = allStats.FirstOrDefault(s =>
                s.StudentID == req.StudentId
                && s.QuizID == req.QuizId.Value);
            if (mine == null)
                throw new ArgumentException("Student has no stats for this quiz", nameof(req.QuizId));

            bool success = mine.CorrectAnswers >= 2;

            //review session dedect
            if (!success)
            {
                var reviewSessionList = await _reviewSessionService.GetReviewSessionByStudentIdAsync(req.StudentId);
                var filteredReviewSession = reviewSessionList.Where(rS => rS.SubLessonId == subLessonId).FirstOrDefault();

                if (filteredReviewSession != null)
                {
                    if (filteredReviewSession.ReviewSessionType != ReviewSessionTypeEnum.Quiz && filteredReviewSession.ReviewSessionType != ReviewSessionTypeEnum.Both)
                    {
                        filteredReviewSession.ReviewSessionType = ReviewSessionTypeEnum.Both;

                        await _reviewSessionService.UpdateReviewSessionAsync(filteredReviewSession);
                    }
                }
                else
                {
                    var newReviewSession = new ReviewSession
                    {
                        StudentId = req.StudentId,
                        SubLessonId = subLessonId,
                        FailCount = 0,
                        ReviewSessionType = ReviewSessionTypeEnum.Quiz,
                        IsTestSolved = false,
                        IsCompleted = false,
                        CreateDate = DateTime.UtcNow,
                    };

                    await _reviewSessionService.AddReviewSessionAsync(newReviewSession);
                }
            }

            return new ComparisonResponse
            {
                AvgCorrectAnswers = avgCorrect,
                AvgWrongAnswers = avgWrong,
                AvgDurationInMillis = avgDuration,
                StudentCorrectAnswers = mine.CorrectAnswers,
                StudentWrongAnswers = mine.WrongAnswers,
                StudentDurationInMillis = mine.DurationInMilliseconds,
                IsSuccessful = success
            };
        }

        public async Task<TestResponse> GetTestByIdAsync(int testId, int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Öğrenci bulunamadı!", nameof(studentId));

            var test = await _testService.GetTestByIdAsync(testId);
            if (test == null)
                throw new ArgumentException("Test bulunamadı!", nameof(testId));

            var questions = await _testQuestionService.GetAllTestQuestionsAsync();
            var filteredQuestions = questions.Where(q => q.TestID == testId).ToList();

            var questionOptions = await _testQuestionOptionService.GetAllTestQuestionOptionsAsync();

            var studentAnswers = test.IsSolved
                ? (await _testAnswerService.GetAllTestAnswersAsync())
                    .Where(a => a.StudentID == studentId && a.TestID == testId)
                    .ToList()
                : new List<TestAnswer>();

            var testResponse = new TestResponse
            {
                TestID = test.TestID,
                SubLessonID = test.SubLessonID ?? 0,
                LessonID = test.LessonID ?? 0,
                Title = test.Title,
                Description = test.Description,
                CreateDate = test.CreateDate,
                IsSolved = test.IsSolved,
                TestType = test.TestType,
                TestQuestions = new List<TestQuestionResponse>()
            };

            foreach (var question in filteredQuestions)
            {
                var questionResponse = new TestQuestionResponse
                {
                    QuestionID = question.QuestionID,
                    TestID = question.TestID,
                    QuestionText = question.QuestionText,
                    TestQuestionOptions = new List<TestQuestionOptionResponse>()
                };

                var filteredQuestionOptions = questionOptions
                    .Where(qo => qo.QuestionID == question.QuestionID)
                    .ToList();

                foreach (var option in filteredQuestionOptions)
                {
                    bool? isSelected = null;

                    if (test.IsSolved)
                    {
                        var selectedAnswer = studentAnswers
                            .FirstOrDefault(a => a.QuestionID == question.QuestionID);
                        isSelected = selectedAnswer?.SelectedOptionID == option.OptionID;
                    }

                    var optionResponse = new TestQuestionOptionResponse
                    {
                        OptionID = option.OptionID,
                        QuestionID = option.QuestionID,
                        OptionText = option.OptionText,
                        IsCorrect = option.IsCorrect,
                        isSelected = isSelected
                    };

                    questionResponse.TestQuestionOptions.Add(optionResponse);
                }

                testResponse.TestQuestions.Add(questionResponse);
            }

            return testResponse;
        }

        public async Task<TestResponse> GenerateTest(GenerateTest generateTest)
        {
            var student = await _studentService.GetByIdAsync(generateTest.StudentId);
            if (student == null) throw new ArgumentException("Student not found!", nameof(generateTest.StudentId));

            var courses = await _courseService.GetAllCourseAsync();
            var lessons = await _lessonService.GetAllLessonAsync();
            var sublessons = await _subLessonService.GetAllSubLessonAsync();

            var filteredRS = new ReviewSession();
            if (generateTest.IsReviewSession)
            {
                var studentReviewSessions = await _reviewSessionService.GetReviewSessionByStudentIdAsync(generateTest.StudentId);
                filteredRS = studentReviewSessions
                    .Where(rs => rs.SubLessonId == generateTest.SubLessonId)
                    .FirstOrDefault();

                if (filteredRS != null && filteredRS.ReviewSessionId > 0)
                {
                    if (!filteredRS.IsTestSolved)
                    {
                        if (!string.IsNullOrWhiteSpace(filteredRS.TestJsonData))
                        {
                            var rawTest = JsonConvert.DeserializeObject<TestResponse>(filteredRS.TestJsonData);

                            var testQuestions = rawTest.TestQuestions.Select((q, index) => new TestQuestionResponse
                            {
                                QuestionID = index + 1,
                                NumberOfQuestion = (index + 1).ToString(),
                                TestID = filteredRS.ReviewSessionId,
                                QuestionText = q.QuestionText,
                                TestQuestionOptions = q.TestQuestionOptions.Select((o, optIndex) => new TestQuestionOptionResponse
                                {
                                    OptionID = optIndex + 1,
                                    QuestionID = index + 1,
                                    OptionText = o.OptionText,
                                    IsCorrect = o.IsCorrect,
                                    isSelected = null
                                }).ToList()
                            }).ToList();

                            return new TestResponse
                            {
                                CreateDate = filteredRS.CreateDate,
                                Description = rawTest.Description,
                                DurationInMilliseconds = 0,
                                IsReviewSession = true,
                                IsSolved = false,
                                SubLessonID = filteredRS.SubLessonId,
                                TestID = filteredRS.ReviewSessionId,
                                TestType = TestTypeEnum.NormalTest,
                                Title = rawTest.Title,
                                TestQuestions = testQuestions
                            };
                        }
                    }
                    else
                    {
                        if (!string.IsNullOrWhiteSpace(filteredRS.TestJsonData) &&
                            !string.IsNullOrWhiteSpace(filteredRS.TestAnswerJsonData))
                        {
                            var rawTest = JsonConvert.DeserializeObject<TestResponse>(filteredRS.TestJsonData);
                            var solvedTest = JsonConvert.DeserializeObject<TestResponse>(filteredRS.TestAnswerJsonData);

                            var testQuestions = rawTest.TestQuestions.Select((q, index) =>
                            {
                                var questionId = index + 1;
                                var solvedQuestion = solvedTest.TestQuestions?.FirstOrDefault(sq => sq.QuestionID == questionId);

                                return new TestQuestionResponse
                                {
                                    QuestionID = questionId,
                                    NumberOfQuestion = (index + 1).ToString(),
                                    TestID = filteredRS.ReviewSessionId,
                                    QuestionText = q.QuestionText,
                                    TestQuestionOptions = q.TestQuestionOptions.Select((o, optIndex) =>
                                    {
                                        var optionId = optIndex + 1;
                                        var solvedOption = solvedQuestion?.TestQuestionOptions?
                                            .FirstOrDefault(so => so.OptionID == optionId);

                                        return new TestQuestionOptionResponse
                                        {
                                            OptionID = optionId,
                                            QuestionID = questionId,
                                            OptionText = o.OptionText,
                                            IsCorrect = o.IsCorrect,
                                            isSelected = false
                                        };
                                    }).ToList()
                                };
                            }).ToList();

                            return new TestResponse
                            {
                                CreateDate = filteredRS.CreateDate,
                                Description = rawTest.Description,
                                DurationInMilliseconds = 0,
                                IsReviewSession = true,
                                IsSolved = true,
                                SubLessonID = filteredRS.SubLessonId,
                                TestID = filteredRS.ReviewSessionId,
                                TestType = TestTypeEnum.NormalTest,
                                Title = rawTest.Title,
                                TestQuestions = testQuestions
                            };
                        }
                    }
                }
            }

            Lesson filteredLesson = null;
            Course filteredCourse = null;
            List<SubLesson> filteredSubLessons = new();
            List<Test> filteredTests = new();
            List<Test> filteredQuickTests = new();
            List<Test> filteredNormalTests = new();
            List<Test> filteredGeneralTests = new();

            if (generateTest.GeneralTest)
            {
                if (!generateTest.LessonId.HasValue)
                    throw new ArgumentException("General test için LessonId gereklidir.", nameof(generateTest.LessonId));

                filteredLesson = await _lessonService.GetLessonByIdAsync(generateTest.LessonId.Value);
                if (filteredLesson == null) throw new ArgumentException("Lesson not found!", nameof(generateTest.LessonId));

                filteredSubLessons = sublessons.Where(sbl => sbl.LessonID == generateTest.LessonId.Value).ToList();
                if (!filteredSubLessons.Any())
                    throw new ArgumentException("Bu ders için alt ders bulunamadı.", nameof(generateTest.LessonId));

                filteredCourse = courses.FirstOrDefault(c => c.CourseID == filteredLesson.CourseID);
                if (filteredCourse == null) throw new ArgumentException("Course not found!", nameof(filteredLesson.CourseID));

                var tests = await _testService.GetAllTestAsync();
                filteredTests = tests.Where(t => t.StudentId == generateTest.StudentId &&
                    (t.SubLessonID.HasValue ? filteredSubLessons.Select(s => s.SubLessonID).Contains(t.SubLessonID.Value) : false))
                    .ToList();
                filteredGeneralTests = filteredTests.Where(t => t.TestType == TestTypeEnum.GeneralTest).ToList();
            }
            else if (generateTest.QuickTest || generateTest.NormalTest)
            {
                if (!generateTest.SubLessonId.HasValue)
                    throw new ArgumentException("Hızlı veya normal test için SubLessonId gereklidir.", nameof(generateTest.SubLessonId));

                var subLesson = await _subLessonService.GetSubLessonByIdAsync(generateTest.SubLessonId.Value);
                if (subLesson == null) throw new ArgumentException("SubLesson not found!", nameof(generateTest.SubLessonId));

                filteredLesson = lessons.FirstOrDefault(l => l.LessonID == subLesson.LessonID);
                if (filteredLesson == null) throw new ArgumentException("Lesson not found!", nameof(subLesson.LessonID));

                filteredSubLessons = sublessons.Where(sbl => sbl.LessonID == filteredLesson.LessonID).ToList();
                filteredCourse = courses.FirstOrDefault(c => c.CourseID == filteredLesson.CourseID);
                if (filteredCourse == null) throw new ArgumentException("Course not found!", nameof(filteredLesson.CourseID));

                var tests = await _testService.GetAllTestAsync();
                filteredTests = tests.Where(t => t.SubLessonID == generateTest.SubLessonId.Value
                    && t.StudentId == generateTest.StudentId).ToList();
                filteredQuickTests = filteredTests.Where(t => t.TestType == TestTypeEnum.QuickTest).ToList();
                filteredNormalTests = filteredTests.Where(t => t.TestType == TestTypeEnum.NormalTest).ToList();
                filteredGeneralTests = filteredTests.Where(t => t.TestType == TestTypeEnum.GeneralTest).ToList();
            }
            else if (generateTest.IsReviewSession)
            {
                if (!generateTest.SubLessonId.HasValue)
                    throw new ArgumentException("Hızlı veya normal test için SubLessonId gereklidir.", nameof(generateTest.SubLessonId));

                var subLesson = await _subLessonService.GetSubLessonByIdAsync(generateTest.SubLessonId.Value);
                if (subLesson == null) throw new ArgumentException("SubLesson not found!", nameof(generateTest.SubLessonId));

                filteredLesson = lessons.FirstOrDefault(l => l.LessonID == subLesson.LessonID);
                if (filteredLesson == null) throw new ArgumentException("Lesson not found!", nameof(subLesson.LessonID));

                filteredSubLessons = sublessons.Where(sbl => sbl.LessonID == filteredLesson.LessonID).ToList();
                filteredCourse = courses.FirstOrDefault(c => c.CourseID == filteredLesson.CourseID);
                if (filteredCourse == null) throw new ArgumentException("Course not found!", nameof(filteredLesson.CourseID));
            }
            else
            {
                throw new ArgumentException("Test türü belirlenemedi.", nameof(generateTest));
            }

            if (generateTest.QuickTest && filteredQuickTests.Count == 1)
            {
                var filteredTest = filteredQuickTests.First();
                List<TestAnswer> studentAnswers = new();

                var questions = await _testQuestionService.GetAllTestQuestionsAsync();
                var questionOptions = await _testQuestionOptionService.GetAllTestQuestionOptionsAsync();

                if (filteredTest.IsSolved)
                {
                    studentAnswers = (await _testAnswerService.GetAllTestAnswersAsync())
                        .Where(a => a.StudentID == generateTest.StudentId && a.TestID == filteredTest.TestID)
                        .ToList();
                }

                var testResponse = new TestResponse
                {
                    TestID = filteredTest.TestID,
                    SubLessonID = filteredTest.SubLessonID.Value,
                    Title = filteredTest.Title,
                    Description = filteredTest.Description,
                    CreateDate = filteredTest.CreateDate,
                    IsSolved = filteredTest.IsSolved,
                    TestType = filteredTest.TestType,
                    TestQuestions = new List<TestQuestionResponse>()
                };

                var filteredQuestions = questions.Where(q => q.TestID == filteredTest.TestID).ToList();

                foreach (var question in filteredQuestions)
                {
                    var questionResponse = new TestQuestionResponse
                    {
                        QuestionID = question.QuestionID,
                        TestID = question.TestID,
                        QuestionText = question.QuestionText,
                        TestQuestionOptions = new List<TestQuestionOptionResponse>()
                    };

                    var filteredQuestionOptions = questionOptions
                        .Where(qo => qo.QuestionID == question.QuestionID)
                        .ToList();

                    foreach (var option in filteredQuestionOptions)
                    {
                        bool? isSelected = null;

                        if (filteredTest.IsSolved)
                        {
                            var selectedAnswer = studentAnswers
                                .FirstOrDefault(a => a.QuestionID == question.QuestionID);

                            isSelected = selectedAnswer?.SelectedOptionID == option.OptionID;
                        }

                        var optionResponse = new TestQuestionOptionResponse
                        {
                            OptionID = option.OptionID,
                            QuestionID = option.QuestionID,
                            OptionText = option.OptionText,
                            IsCorrect = option.IsCorrect,
                            isSelected = filteredTest.IsSolved ? isSelected : null
                        };

                        questionResponse.TestQuestionOptions.Add(optionResponse);
                    }

                    testResponse.TestQuestions.Add(questionResponse);
                }

                return testResponse;
            }

            if (generateTest.GeneralTest && filteredGeneralTests.Count >= 3)
            {
                return new TestResponse
                {
                    Description = "Maksimum genel test sınırına (3) ulaşıldı!",
                    Status = 300
                };
            }

            if (generateTest.NormalTest && filteredNormalTests.Count >= 3)
            {
                return new TestResponse
                {
                    Description = "Maksimum test sınırına ulaşıldı!",
                    Status = 300
                };
            }

            if (generateTest.QuickTest && filteredQuickTests.Count >= 1)
            {
                return new TestResponse
                {
                    Description = "Maksimum test sınırına ulaşıldı!",
                    Status = 300
                };
            }

            TestTypeEnum testType;
            string promptText = string.Empty;
            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();

            if (generateTest.QuickTest)
            {
                testType = TestTypeEnum.QuickTest;
                var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 2);
                if (systemPrompt == null)
                    throw new Exception("Hızlı test için prompt (ContentType 2) bulunamadı.");

                var subLesson = await _subLessonService.GetSubLessonByIdAsync(generateTest.SubLessonId.Value);
                promptText = systemPrompt.PromptText
                    .Replace("[COURSE_NAME]", filteredCourse.Name)
                    .Replace("[LESSON_NAME]", filteredLesson.Title)
                    .Replace("[SUBLESSON_NAME]", subLesson.Title)
                    .Replace("[Question_Amount]", "20")
                    .Replace("[QUESTION_OPTIN_AMOUNT]", "3");
            }
            else if (generateTest.GeneralTest)
            {
                testType = TestTypeEnum.GeneralTest;
                var sublessonTitlesWithObjectives = string.Join("\n\n",
                    filteredSubLessons.Select(s => $"{s.Title}:\n{s.LessonObjective}"));

                var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 6);
                if (systemPrompt == null)
                    throw new Exception("Genel test için prompt (ContentType 6) bulunamadı.");

                promptText = systemPrompt.PromptText
                    .Replace("[COURSE_NAME]", filteredCourse.Name)
                    .Replace("[LESSON_OBJECTİVES]", sublessonTitlesWithObjectives)
                    .Replace("[QUESTION_AMOUNT]", "20")
                    .Replace("[QUESTION_OPTION_AMOUNT]", "3");
            }
            else if (generateTest.NormalTest || generateTest.IsReviewSession)
            {
                testType = TestTypeEnum.NormalTest;
                var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 2);
                if (systemPrompt == null)
                    throw new Exception("Normal test için prompt (ContentType 2) bulunamadı.");

                var subLesson = await _subLessonService.GetSubLessonByIdAsync(generateTest.SubLessonId.Value);
                promptText = systemPrompt.PromptText
                    .Replace("[COURSE_NAME]", filteredCourse.Name)
                    .Replace("[LESSON_NAME]", filteredLesson.Title)
                    .Replace("[SUBLESSON_NAME]", subLesson.Title)
                    .Replace("[Question_Amount]", "20")
                    .Replace("[QUESTION_OPTIN_AMOUNT]", "3");
            }
            else
            {
                throw new ArgumentException("Test türü belirlenemedi.", nameof(generateTest));
            }

            var messages = new List<ChatGptMessage>
            {
                new ChatGptMessage
                {
                    role = "system",
                    content = promptText
                }
            };

            var result = await _chatGptService.SendAiRequestAsync(messages);

            TestResponse generatedTestResponse;
            try
            {
                var rawResponse = JsonConvert.DeserializeObject<RawTestResponse>(result);
                if (rawResponse?.Test == null)
                    throw new Exception("AI'dan gelen yanıt beklenen formatta değil.");

                generatedTestResponse = new TestResponse
                {
                    TestID = filteredRS?.ReviewSessionId ?? 0,
                    Title = rawResponse.Test.Title,
                    Description = rawResponse.Test.Description,
                    CreateDate = DateTime.Now,
                    IsSolved = false,
                    IsReviewSession = generateTest.IsReviewSession,
                    SubLessonID = generateTest.SubLessonId,
                    TestType = TestTypeEnum.NormalTest,
                    DurationInMilliseconds = 0,
                    TestQuestions = rawResponse.Test.Questions
                    .Select((q, index) =>
                    {
                        var questionId = index + 1;

                        return new TestQuestionResponse
                        {
                            QuestionID = questionId,
                            NumberOfQuestion = $"{(index + 1)}. Soru",
                            QuestionText = q.QuestionText,
                            TestQuestionOptions = q.Options.Select((o, optIndex) =>
                            {
                                var optionId = optIndex + 1;

                                return new TestQuestionOptionResponse
                                {
                                    OptionID = optionId,
                                    QuestionID = questionId,
                                    OptionText = o.OptionText,
                                    IsCorrect = o.IsCorrect,
                                    isSelected = false
                                };
                            }).ToList()
                        };
                    }).ToList()
                };
            }
            catch (JsonReaderException ex)
            {
                throw new Exception($"AI'dan gelen yanıt geçerli bir JSON değil: {ex.Message}", ex);
            }

            if (generateTest.IsReviewSession)
            {
                var studentReviewSessions = await _reviewSessionService.GetReviewSessionByStudentIdAsync(generateTest.StudentId);
                filteredRS = studentReviewSessions
                    .Where(rs => rs.SubLessonId == generateTest.SubLessonId)
                    .FirstOrDefault();

                if (filteredRS != null)
                {
                    filteredRS.TestJsonData = JsonConvert.SerializeObject(generatedTestResponse);
                    filteredRS.CreateDate = DateTime.Now;
                    filteredRS.IsTestSolved = false;

                    await _reviewSessionService.UpdateReviewSessionAsync(filteredRS);

                    var rawTest = JsonConvert.DeserializeObject<TestResponse>(filteredRS.TestJsonData);

                    var testQuestions = rawTest.TestQuestions.Select((q, index) =>
                    {
                        var questionId = index + 1;

                        return new TestQuestionResponse
                        {
                            QuestionID = questionId,
                            NumberOfQuestion = $"{(index + 1)}. Soru",
                            TestID = filteredRS.ReviewSessionId,
                            QuestionText = q.QuestionText,
                            TestQuestionOptions = q.TestQuestionOptions.Select((o, optIndex) =>
                            {
                                var optionId = optIndex + 1;

                                return new TestQuestionOptionResponse
                                {
                                    OptionID = optionId,
                                    QuestionID = questionId,
                                    OptionText = o.OptionText,
                                    IsCorrect = o.IsCorrect,
                                    isSelected = false
                                };
                            }).ToList()
                        };
                    }).ToList();

                    return new TestResponse
                    {
                        CreateDate = filteredRS.CreateDate,
                        Description = rawTest.Description,
                        DurationInMilliseconds = 0,
                        IsReviewSession = true,
                        IsSolved = false,
                        SubLessonID = filteredRS.SubLessonId,
                        TestID = filteredRS.ReviewSessionId,
                        TestType = TestTypeEnum.NormalTest,
                        Title = rawTest.Title,
                        TestQuestions = testQuestions
                    };
                }
            }

            var newTest = new Test
            {
                Title = generatedTestResponse.Title,
                StudentId = generateTest.StudentId,
                Description = generatedTestResponse.Description,
                SubLessonID = generateTest.QuickTest || generateTest.NormalTest ? generateTest.SubLessonId : null,
                LessonID = generateTest.GeneralTest ? generateTest.LessonId : null,
                CreateDate = DateTime.UtcNow,
                TestType = testType
            };

            var createdTest = await _testService.CreateTestAsync(newTest);

            var newTestResponse = new TestResponse
            {
                TestID = createdTest.TestID,
                SubLessonID = createdTest.SubLessonID ?? 0,
                Title = createdTest.Title,
                Description = createdTest.Description,
                CreateDate = createdTest.CreateDate,
                TestQuestions = new List<TestQuestionResponse>()
            };

            foreach (var question in generatedTestResponse.TestQuestions)
            {
                var newQuestion = new TestQuestion
                {
                    QuestionText = question.QuestionText,
                    TestID = createdTest.TestID
                };

                var createdTestQuestion = await _testQuestionService.CreateTestQuestionAsync(newQuestion);

                var questionResponse = new TestQuestionResponse
                {
                    QuestionID = createdTestQuestion.QuestionID,
                    TestID = createdTestQuestion.TestID,
                    QuestionText = createdTestQuestion.QuestionText,
                    TestQuestionOptions = new List<TestQuestionOptionResponse>()
                };

                foreach (var option in question.TestQuestionOptions)
                {
                    var newQuestionOption = new TestQuestionOption
                    {
                        QuestionID = createdTestQuestion.QuestionID,
                        OptionText = option.OptionText,
                        IsCorrect = option.IsCorrect
                    };

                    var createdOption = await _testQuestionOptionService.CreateTestQuestionOptionAsync(newQuestionOption);

                    questionResponse.TestQuestionOptions.Add(new TestQuestionOptionResponse
                    {
                        OptionID = createdOption.OptionID,
                        QuestionID = createdOption.QuestionID,
                        OptionText = createdOption.OptionText,
                        IsCorrect = createdOption.IsCorrect
                    });
                }

                newTestResponse.TestQuestions.Add(questionResponse);
            }

            return newTestResponse;
        }

        public async Task<QuizResponse> GenerateQuiz(GenerateQuiz generateQuiz)
        {
            // 1. Öğrenci kontrolü
            var student = await _studentService.GetByIdAsync(generateQuiz.StudentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(generateQuiz.StudentId));

            // 2. Kurs, ders, alt ders verilerini al
            var courses = await _courseService.GetAllCourseAsync();
            var lessons = await _lessonService.GetAllLessonAsync();
            var sublessons = await _subLessonService.GetAllSubLessonAsync();

            Lesson filteredLesson = null;
            Course filteredCourse = null;
            var filteredSubLessons = new List<SubLesson>();
            var filteredQuizzes = new List<Quiz>();
            var filteredQuickQuizzes = new List<Quiz>();
            var filteredNormalQuizzes = new List<Quiz>();
            var filteredGeneralQuizzes = new List<Quiz>();

            // 3. Filtreleme: General / Quick / Normal quiz
            if (generateQuiz.GeneralQuiz)
            {
                if (!generateQuiz.LessonId.HasValue)
                    throw new ArgumentException("General quiz için LessonId gereklidir.", nameof(generateQuiz.LessonId));

                filteredLesson = await _lessonService.GetLessonByIdAsync(generateQuiz.LessonId.Value)
                                  ?? throw new ArgumentException("Lesson not found!", nameof(generateQuiz.LessonId));

                filteredSubLessons = sublessons
                    .Where(s => s.LessonID == generateQuiz.LessonId.Value)
                    .ToList();
                if (!filteredSubLessons.Any())
                    throw new ArgumentException("Bu ders için alt ders bulunamadı.", nameof(generateQuiz.LessonId));

                filteredCourse = courses
                    .FirstOrDefault(c => c.CourseID == filteredLesson.CourseID)
                    ?? throw new ArgumentException("Course not found!", nameof(filteredLesson.CourseID));

                var all = await _quizService.GetAllQuizzesAsync();
                filteredQuizzes = all
                    .Where(q => q.StudentId == generateQuiz.StudentId
                             && q.SubLessonID.HasValue
                             && filteredSubLessons.Select(s => s.SubLessonID).Contains(q.SubLessonID.Value))
                    .ToList();
                filteredGeneralQuizzes = filteredQuizzes
                    .Where(q => q.QuizType == QuizTypeEnum.GeneralQuiz)
                    .ToList();
            }
            else if (generateQuiz.QuickQuiz || generateQuiz.NormalQuiz)
            {
                if (!generateQuiz.SubLessonId.HasValue)
                    throw new ArgumentException("Hızlı veya normal quiz için SubLessonId gereklidir.", nameof(generateQuiz.SubLessonId));

                var subLesson = await _subLessonService.GetSubLessonByIdAsync(generateQuiz.SubLessonId.Value)
                                ?? throw new ArgumentException("SubLesson not found!", nameof(generateQuiz.SubLessonId));

                filteredLesson = lessons
                    .FirstOrDefault(l => l.LessonID == subLesson.LessonID)
                    ?? throw new ArgumentException("Lesson not found!", nameof(subLesson.LessonID));

                filteredSubLessons = sublessons
                    .Where(s => s.LessonID == filteredLesson.LessonID)
                    .ToList();

                filteredCourse = courses
                    .FirstOrDefault(c => c.CourseID == filteredLesson.CourseID)
                    ?? throw new ArgumentException("Course not found!", nameof(filteredLesson.CourseID));

                var all = await _quizService.GetAllQuizzesAsync();
                filteredQuizzes = all
                    .Where(q => q.StudentId == generateQuiz.StudentId
                             && q.SubLessonID == generateQuiz.SubLessonId)
                    .ToList();

                filteredQuickQuizzes = filteredQuizzes.Where(q => q.QuizType == QuizTypeEnum.QuickQuiz).ToList();
                filteredNormalQuizzes = filteredQuizzes.Where(q => q.QuizType == QuizTypeEnum.NormalQuiz).ToList();
            }
            else
            {
                throw new ArgumentException("Quiz türü belirlenemedi.", nameof(generateQuiz));
            }

            // 4. Limit kontrolleri
            if (generateQuiz.QuickQuiz && filteredQuickQuizzes.Count == 1)
            {
                var filteredQuiz = filteredQuickQuizzes.First();
                List<QuizAnswer> studentAnswers = new();

                var questions = await _quizQuestionService.GetAllQuizQuestionsAsync();
                var questionOptions = await _quizQuestionOptionService.GetAllQuizQuestionOptionsAsync();

                if (filteredQuiz.IsSolved)
                {
                    studentAnswers = (await _quizAnswerService.GetAllQuizAnswersAsync())
                        .Where(a => a.StudentID == generateQuiz.StudentId && a.QuizID == filteredQuiz.QuizID)
                        .ToList();
                }

                var quizResponse = new QuizResponse
                {
                    QuizID = filteredQuiz.QuizID,
                    SubLessonID = filteredQuiz.SubLessonID,
                    Title = filteredQuiz.Title,
                    Description = filteredQuiz.Description,
                    CreateDate = filteredQuiz.CreateDate,
                    IsSolved = filteredQuiz.IsSolved,
                    QuizType = filteredQuiz.QuizType,
                    QuizQuestions = new List<QuizQuestionResponse>()
                };

                var filteredQuestions = questions.Where(q => q.QuizID == filteredQuiz.QuizID).ToList();

                foreach (var question in filteredQuestions)
                {
                    var questionResponse = new QuizQuestionResponse
                    {
                        QuestionID = question.QuestionID,
                        QuizID = question.QuizID,
                        QuestionText = question.QuestionText,
                        QuizQuestionOptions = new List<QuizQuestionOptionResponse>()
                    };

                    var filteredQuestionOptions = questionOptions
                        .Where(qo => qo.QuestionID == question.QuestionID)
                        .ToList();

                    foreach (var option in filteredQuestionOptions)
                    {
                        bool? isSelected = null;

                        if (filteredQuiz.IsSolved)
                        {
                            var selectedAnswer = studentAnswers
                                .FirstOrDefault(a => a.QuestionID == question.QuestionID);

                            isSelected = selectedAnswer?.SelectedOptionID == option.OptionID;
                        }

                        var optionResponse = new QuizQuestionOptionResponse
                        {
                            OptionID = option.OptionID,
                            QuestionID = option.QuestionID,
                            OptionText = option.OptionText,
                            IsCorrect = option.IsCorrect,
                            isSelected = filteredQuiz.IsSolved ? isSelected : null
                        };

                        questionResponse.QuizQuestionOptions.Add(optionResponse);
                    }

                    quizResponse.QuizQuestions.Add(questionResponse);
                }

                return quizResponse;
            }

            if (generateQuiz.QuickQuiz && filteredQuickQuizzes.Count > 1)
                return new QuizResponse { Description = "Maksimum quiz sınırına ulaşıldı!", Status = 300 };
            if (generateQuiz.GeneralQuiz && filteredGeneralQuizzes.Count >= 3)
                return new QuizResponse { Description = "Maksimum genel quiz sınırına (3) ulaşıldı!", Status = 300 };
            if (generateQuiz.NormalQuiz && filteredNormalQuizzes.Count >= 3)
                return new QuizResponse { Description = "Maksimum quiz sınırına ulaşıldı!", Status = 300 };

            // 5. AI prompt’u seç ve yer tutucuları doldur
            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            ChatGptMessage systemMessage;

            if (generateQuiz.QuickQuiz || generateQuiz.NormalQuiz)
            {
                var prompt = allPrompts
                    .FirstOrDefault(p => p.ContentType == ContentTypeEnum.Quiz)
                    ?? throw new Exception("Quiz prompt bulunamadı (ContentType=Quiz).");


                var subLesson = await _subLessonService.GetSubLessonByIdAsync(generateQuiz.SubLessonId.Value);

                systemMessage = new ChatGptMessage
                {
                    role = "system",
                    content = prompt.PromptText
                        .Replace("[COURSE_NAME]", filteredCourse.Name)
                        .Replace("[LESSON_NAME]", filteredLesson.Title)
                        .Replace("[SUBLESSON_NAME]", subLesson.Title)
                        .Replace("[Question_Amount]", "5")
                        .Replace("[QUESTION_OPTIN_AMOUNT]", "4")
                };
            }
            else // generateQuiz.GeneralQuiz
            {
                var prompt = allPrompts
                    .FirstOrDefault(p => p.ContentType == ContentTypeEnum.GeneralQuiz)
                    ?? throw new Exception("General quiz prompt bulunamadı (ContentType=GeneralQuiz).");

                systemMessage = new ChatGptMessage
                {
                    role = "system",
                    content = prompt.PromptText
                        .Replace("[COURSE_NAME]", filteredCourse.Name)
                        .Replace("[LESSON_OBJECTİVES]", string.Join(
                            "\n", filteredSubLessons.Select(s => s.LessonObjective)))
                        .Replace("[Question_Amount]", "5")
                        .Replace("[QUESTION_OPTION_AMOUNT]", "4")
                };
            }

            // 6. AI isteği
            var messages = new List<ChatGptMessage> { systemMessage };
            var aiResult = await _chatGptService.SendAiRequestAsync(messages);

            // 7. JSON parse
            RawQuizResponse rawQuiz;
            try
            {
                rawQuiz = JsonConvert.DeserializeObject<RawQuizResponse>(aiResult)
                          ?? throw new Exception("AI yanıtı beklenen formatta değil.");
            }
            catch (JsonReaderException ex)
            {
                throw new Exception($"AI yanıtı geçerli JSON değil: {ex.Message}", ex);
            }

            // 8. Yeni Quiz entity’si oluştur ve kaydet
            var newQuiz = new Quiz
            {
                Title = rawQuiz.Quiz.Title,
                Description = rawQuiz.Quiz.Description,
                StudentId = generateQuiz.StudentId,
                SubLessonID = generateQuiz.SubLessonId,
                LessonID = generateQuiz.GeneralQuiz ? generateQuiz.LessonId : null,
                CreateDate = DateTime.UtcNow,
                QuizType = generateQuiz.QuickQuiz ? QuizTypeEnum.QuickQuiz
                            : generateQuiz.NormalQuiz ? QuizTypeEnum.NormalQuiz
                            : QuizTypeEnum.GeneralQuiz,
                IsSolved = false
            };
            var createdQuiz = await _quizService.CreateQuizAsync(newQuiz);

            // 9. Soruları ve seçenekleri kaydet, response’u hazırla
            var response = new QuizResponse
            {
                QuizID = createdQuiz.QuizID,
                StudentId = createdQuiz.StudentId,
                SubLessonID = createdQuiz.SubLessonID,
                LessonID = createdQuiz.LessonID,
                Title = createdQuiz.Title,
                Description = createdQuiz.Description,
                CreateDate = createdQuiz.CreateDate,
                QuizQuestions = new List<QuizQuestionResponse>()
            };

            foreach (var q in rawQuiz.Quiz.QuizQuestions)
            {
                var entityQ = await _quizQuestionService.CreateQuizQuestionAsync(new QuizQuestion
                {
                    QuizID = createdQuiz.QuizID,
                    QuestionText = q.QuestionText
                });

                var qr = new QuizQuestionResponse
                {
                    QuestionID = entityQ.QuestionID,
                    QuizID = entityQ.QuizID,
                    QuestionText = entityQ.QuestionText,
                    QuizQuestionOptions = new List<QuizQuestionOptionResponse>()
                };

                foreach (var o in q.QuizQuestionOptions)
                {
                    var entityO = await _quizQuestionOptionService.CreateQuizQuestionOptionAsync(new QuizQuestionOption
                    {
                        QuestionID = entityQ.QuestionID,
                        OptionText = o.OptionText,
                        IsCorrect = o.IsCorrect
                    });

                    qr.QuizQuestionOptions.Add(new QuizQuestionOptionResponse
                    {
                        OptionID = entityO.OptionID,
                        QuestionID = entityO.QuestionID,
                        OptionText = entityO.OptionText,
                        IsCorrect = entityO.IsCorrect
                    });
                }

                response.QuizQuestions.Add(qr);
            }

            return response;
        }
        
        public async Task<bool> SaveTestResult(TestResponse testResponse, int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null) throw new ArgumentException(nameof(student), "Student not found!");

            int correctAnswerCount = 0;

            foreach (var question in testResponse.TestQuestions)
            {
                var selectedOption = question.TestQuestionOptions.FirstOrDefault(o => o.isSelected == true);

                if (selectedOption != null)
                {
                    var newTestAnswer = new TestAnswer
                    {
                        StudentID = studentId,
                        TestID = testResponse.TestID,
                        QuestionID = question.QuestionID,
                        SelectedOptionID = selectedOption.OptionID,
                    };

                    if (!testResponse.IsReviewSession)
                    {
                        await _testAnswerService.CreateTestAnswerAsync(newTestAnswer);
                    }

                    if (selectedOption.IsCorrect)
                    {
                        correctAnswerCount++;
                    }
                }
            }

            if (testResponse.IsReviewSession)
            {
                var studentReviewSessionData = await _reviewSessionService.GetReviewSessionByIdAsync(testResponse.TestID);
                if (studentReviewSessionData != null)
                {
                    studentReviewSessionData.IsTestSolved = true;

                    studentReviewSessionData.TestAnswerJsonData = JsonConvert.SerializeObject(testResponse);

                    if(correctAnswerCount >= 10)
                    {
                        studentReviewSessionData.IsCompleted = true;
                        var rS = await _reviewSessionService.GetReviewSessionByStudentIdAsync(studentId);
                        var filterRS = rS.Where(rs => rs.SubLessonId == testResponse.SubLessonID).FirstOrDefault();

                        var aiGenerateContents = await _aIGeneratedContentService.GetAllAIGeneratedContentAsync();
                        var filterContent = aiGenerateContents.Where(ai => ai.SubLessonID == testResponse.SubLessonID && ai.StudentID == studentId && ai.ContentType == ContentTypeEnum.LessonContent).FirstOrDefault();
                        if (filterContent == null) throw new ArgumentException("filterContent not found!", nameof(testResponse.SubLessonID));
                        var filterSummary = aiGenerateContents.Where(ai => ai.SubLessonID == testResponse.SubLessonID && ai.StudentID == studentId && ai.ContentType == ContentTypeEnum.LessonSummary).FirstOrDefault();
                        if (filterSummary == null) throw new ArgumentException("filterSummary not found!", nameof(testResponse.SubLessonID));

                        filterContent.GeneratedText = filterRS.ContentText;
                        filterContent.GeneratedImage1 = filterRS.ContentImageOne;
                        filterContent.GeneratedImage2 = filterRS.ContentImageTwo;
                        filterContent.GeneratedImage3 = filterRS.ContentImageThree;

                        filterSummary.GeneratedText = filterRS.SummaryText;
                        filterSummary.GeneratedImage1 = filterRS.SummaryImageOne;
                        filterSummary.GeneratedImage2 = filterRS.SummaryImageTwo;

                        await _aIGeneratedContentService.UpdateAIGeneratedContentAsync(filterContent);
                        await _aIGeneratedContentService.UpdateAIGeneratedContentAsync(filterSummary);
                    }
                    else
                    {
                        studentReviewSessionData.FailCount += 1;
                    }

                    await _reviewSessionService.UpdateReviewSessionAsync(studentReviewSessionData);

                    return true;
                }
            }

            var test = await _testService.GetTestByIdAsync(testResponse.TestID);
            if (test == null) throw new ArgumentException(nameof(test), "Test not found!");

            var xpEarn = correctAnswerCount * 10; //her dogru basina 10xp kazanacak
            await _xPService.ProcessXPAsync(studentId, 12, xpEarn, XPType.EarnXP, description:"Test result");

            test.IsSolved = true;

            if ((testResponse.SubLessonID != null && testResponse.SubLessonID != 0) || (testResponse.LessonID != null && testResponse.LessonID != 0))
            {
                var newUpdateProgressRequest = new UpdateProgressRequest
                {
                    TestType = testResponse.TestType,
                    SubLessonID = testResponse.SubLessonID ?? 0,
                    LessonID = testResponse.LessonID ?? 0,
                };

                await UpdateProgressAsync(newUpdateProgressRequest, studentId);
            }

            var newTestStat = new StudentTestStatistic
            {
                CorrectAnswers = correctAnswerCount,
                TestID = test.TestID,
                TestType = test.TestType,
                StudentID = studentId,
                TestDate = DateTime.Now,
                TotalQuestions = testResponse.TestQuestions.Count,
                WrongAnswers = testResponse.TestQuestions.Count - correctAnswerCount,
                DurationInMilliseconds = testResponse.DurationInMilliseconds,
            };

            await _studentTestStatisticService.CreateStatisticAsync(newTestStat);

            await _testService.UpdateTestAsync(test);
            await _testAnswerService.SaveChangesAsync();

            return true;
        }

        public async Task<bool> SaveQuizResult(QuizResponse quizResponse, int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId)
                          ?? throw new ArgumentException("Student not found!", nameof(studentId));

            var quiz = await _quizService.GetQuizByIdAsync(quizResponse.QuizID)
                      ?? throw new ArgumentException("Quiz not found!", nameof(quizResponse.QuizID));

            var persistedQuestions = (await _quizQuestionService.GetAllQuizQuestionsAsync())
                                        .Where(q => q.QuizID == quizResponse.QuizID)
                                        .OrderBy(q => q.QuestionID)
                                        .ToList();

            var persistedOptions = await _quizQuestionOptionService.GetAllQuizQuestionOptionsAsync();

            int correctAnswerCount = 0;

            for (int i = 0; i < quizResponse.QuizQuestions.Count; i++)
            {
                var userQ = quizResponse.QuizQuestions[i];
                var selected = userQ.QuizQuestionOptions
                                     .FirstOrDefault(o => o.isSelected.GetValueOrDefault());
                if (selected == null || i >= persistedQuestions.Count)
                    continue;

                var dbQuestion = persistedQuestions[i];
                var dbOption = persistedOptions.FirstOrDefault(o =>
                    o.QuestionID == dbQuestion.QuestionID &&
                    o.OptionText.Trim() == selected.OptionText.Trim() &&
                    o.IsCorrect == selected.IsCorrect);
                if (dbOption == null)
                    continue;

                await _quizAnswerService.CreateQuizAnswerAsync(new QuizAnswer
                {
                    StudentID = studentId,
                    QuizID = quizResponse.QuizID,
                    QuestionID = dbQuestion.QuestionID,
                    SelectedOptionID = dbOption.OptionID
                });

                if (dbOption.IsCorrect)
                    correctAnswerCount++;
            }

            await _quizAnswerService.SaveChangesAsync();

            quiz.IsSolved = true;
            await _quizService.UpdateQuizAsync(quiz);

            var newTestStat = new StudentTestStatistic
            {
                CorrectAnswers = correctAnswerCount,
                TestID = null,
                TestType = null,
                StudentID = studentId,
                TestDate = DateTime.Now,
                TotalQuestions = quizResponse.QuizQuestions.Count,
                WrongAnswers = quizResponse.QuizQuestions.Count - correctAnswerCount,
                QuizType = quiz.QuizType,
                QuizID = quiz.QuizID,
                DurationInMilliseconds = quizResponse.DurationInMilliseconds,
            };

            await _studentTestStatisticService.CreateStatisticAsync(newTestStat);

            if ((quizResponse.SubLessonID != null && quizResponse.SubLessonID != 0) || (quizResponse.LessonID != null && quizResponse.LessonID != 0))
            {
                var newUpdateProgressRequest = new UpdateProgressRequest
                {
                    QuizType = quizResponse.QuizType,
                    SubLessonID = quizResponse.SubLessonID ?? 0,
                    LessonID = quizResponse.LessonID ?? 0,
                };

                await UpdateProgressAsync(newUpdateProgressRequest, studentId);
            }

            await _xPService.ProcessXPAsync(
                studentId,
                13,
                correctAnswerCount * 10,
                XPType.EarnXP,
                description: "Quiz result"
            );

            return true;
        }

        public async Task<AskQuizAssistantRobotResponse> AskQuizAssistantRobot(AskQuizAssistantRobotRequest request)
        {
            // Öğrenci kontrolü
            var student = await _studentService.GetByIdAsync(request.StudentId);
            if (student == null)
                throw new ArgumentException("Öğrenci bulunamadı.", nameof(request.StudentId));

            // Quiz bilgilerini çekiyoruz
            var quiz = await _quizService.GetQuizByIdAsync(request.QuizId);
            if (quiz == null)
                throw new ArgumentException("Quiz bulunamadı.", nameof(request.QuizId));

            // Ders, alt ders ve kurs bilgilerini elde ediyoruz
            Course course = null;
            Lesson lesson = null;
            SubLesson subLesson = null;

            if (quiz.SubLessonID.HasValue && quiz.SubLessonID != 0)
            {
                subLesson = await _subLessonService.GetSubLessonByIdAsync(quiz.SubLessonID.Value);
                if (subLesson == null)
                    throw new ArgumentException("Alt ders bulunamadı.", nameof(quiz.SubLessonID));

                lesson = await _lessonService.GetLessonByIdAsync(subLesson.LessonID);
                if (lesson == null)
                    throw new ArgumentException("Ders bulunamadı.", nameof(subLesson.LessonID));

                course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                if (course == null)
                    throw new ArgumentException("Kurs bulunamadı.", nameof(lesson.CourseID));
            }
            else if (quiz.LessonID.HasValue && quiz.LessonID != 0)
            {
                lesson = await _lessonService.GetLessonByIdAsync(quiz.LessonID.Value);
                if (lesson == null)
                    throw new ArgumentException("Ders bulunamadı.", nameof(quiz.LessonID));

                course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                if (course == null)
                    throw new ArgumentException("Kurs bulunamadı.", nameof(lesson.CourseID));
            }
            else
            {
                throw new InvalidOperationException("Quiz, bir ders veya alt derse bağlı değil.");
            }

            // Quiz sorularını ve seçeneklerini çekiyoruz
            var filteredQuestions = (await _quizQuestionService.GetAllQuizQuestionsAsync())
                .Where(q => q.QuizID == request.QuizId)
                .ToList();
            var questionOptions = await _quizQuestionOptionService.GetAllQuizQuestionOptionsAsync();

            // Eğer quiz çözüldüyse, öğrenci yanıtlarını da getiriyoruz
            var studentAnswers = quiz.IsSolved
                ? (await _quizAnswerService.GetAllQuizAnswersAsync())
                    .Where(a => a.StudentID == request.StudentId && a.QuizID == request.QuizId)
                    .ToList()
                : new List<QuizAnswer>();

            // QuizResponse nesnesi oluşturularak prompt için JSON verisi hazırlanıyor
            var quizResponse = new QuizResponse
            {
                QuizID = quiz.QuizID,
                LessonID = quiz.LessonID,
                SubLessonID = quiz.SubLessonID,
                StudentId = quiz.StudentId,
                Title = quiz.Title,
                Description = quiz.Description,
                CreateDate = quiz.CreateDate,
                IsSolved = quiz.IsSolved,
                QuizType = quiz.QuizType,
                QuizQuestions = new List<QuizQuestionResponse>()
            };

            foreach (var question in filteredQuestions)
            {
                var questionResponse = new QuizQuestionResponse
                {
                    QuestionID = question.QuestionID,
                    QuizID = question.QuizID,
                    QuestionText = question.QuestionText,
                    QuizQuestionOptions = new List<QuizQuestionOptionResponse>()
                };

                var filteredQuestionOptions = questionOptions
                    .Where(qo => qo.QuestionID == question.QuestionID)
                    .ToList();

                foreach (var option in filteredQuestionOptions)
                {
                    bool? isSelected = null;
                    if (quiz.IsSolved)
                    {
                        var selectedAnswer = studentAnswers.FirstOrDefault(a => a.QuestionID == question.QuestionID);
                        isSelected = selectedAnswer?.SelectedOptionID == option.OptionID;
                    }

                    var optionResponse = new QuizQuestionOptionResponse
                    {
                        OptionID = option.OptionID,
                        QuestionID = option.QuestionID,
                        OptionText = option.OptionText,
                        IsCorrect = option.IsCorrect,
                        isSelected = isSelected
                    };

                    questionResponse.QuizQuestionOptions.Add(optionResponse);
                }

                quizResponse.QuizQuestions.Add(questionResponse);
            }

            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 8);
            if (systemPrompt == null)
                throw new InvalidOperationException("Quiz asistanı için prompt bulunamadı.");

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
                studentAge--;

            var contentTitle = subLesson != null ? subLesson.Title : lesson.Title;

            var quizDataJson = JsonConvert.SerializeObject(new List<QuizResponse> { quizResponse });

            var promptText = systemPrompt.PromptText
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", course.Name)
                .Replace("[LESSON]", contentTitle)
                .Replace("[QUIZ_DATA]", quizDataJson);

            var messages = await _chatContextService.BuildMessageContextAsync(
                request.StudentId,
                "QuizAssistantRobot",
                promptText,
                request.UserMessage
            );

            var aiResult = await _chatGptService.SendAiRequestAsync(messages);

            var parent = await _userService.GetByIdAsync(student.UserID);

            await _chatContextService.SaveNewMessagePairAsync(
                request.StudentId,
                "QuizAssistantRobot",
                request.UserMessage,
                aiResult
            );

            var analyzeMessageRequest = new AnalizeMessageContentRequest
            {
                ParentMail = parent.Email,
                ParentName = parent.FirstName,
                ParentLastName = parent.LastName,
                StudentName = student.FirstName,
                StudentLastName = student.LastName,
            };

            _ = Task.Run(() => _chatGptService.AnalyzeMessageContentAsync(request.UserMessage, analyzeMessageRequest));

            return new AskQuizAssistantRobotResponse { Content = aiResult };
        }

        public async Task<AskTestAssistantRobotResponse> AskTestAssistantRobot(AskTestAssistantRobotRequest request)
        {
            var student = await _studentService.GetByIdAsync(request.StudentId);
            if (student == null)
                throw new ArgumentException("Öğrenci bulunamadı.", nameof(request.StudentId));

            Course course = null;
            Lesson lesson = null;
            SubLesson subLesson = null;
            TestResponse testResponse = null;

            if (request.IsReviewSession)
            {
                var reviewSessions = await _reviewSessionService.GetReviewSessionByStudentIdAsync(request.StudentId);
                if (reviewSessions == null || !reviewSessions.Any())
                    throw new ArgumentException("Review session not found!", nameof(request.StudentId));

                var filteredRS = reviewSessions
                    .FirstOrDefault(rS => rS.SubLessonId == request.SublessonId);

                if (filteredRS == null || filteredRS.ReviewSessionId <= 0)
                    throw new ArgumentException("Geçerli review session bulunamadı.", nameof(request.SublessonId));

                subLesson = await _subLessonService.GetSubLessonByIdAsync(filteredRS.SubLessonId);
                if (subLesson == null)
                    throw new ArgumentException("Alt ders bulunamadı.", nameof(filteredRS.SubLessonId));

                lesson = await _lessonService.GetLessonByIdAsync(subLesson.LessonID);
                if (lesson == null)
                    throw new ArgumentException("Ders bulunamadı.", nameof(subLesson.LessonID));

                course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                if (course == null)
                    throw new ArgumentException("Kurs bulunamadı.", nameof(lesson.CourseID));

                // JSON'dan TestResponse oluşturuluyor
                if (!string.IsNullOrWhiteSpace(filteredRS.TestAnswerJsonData))
                {
                    try
                    {
                        var reviewTest = JsonConvert.DeserializeObject<TestResponse>(filteredRS.TestAnswerJsonData);
                        if (reviewTest != null)
                        {
                            // prompt için test verisi bu
                            testResponse = reviewTest;
                        }
                    }
                    catch (Exception ex)
                    {
                        throw new InvalidOperationException("Review session'daki test verisi okunamadı.", ex);
                    }
                }
            }

            if (!request.IsReviewSession)
            {
                var test = await _testService.GetTestByIdAsync(request.TestId);
                if (test == null)
                    throw new ArgumentException("Test bulunamadı.", nameof(request.TestId));

                if (test.SubLessonID.HasValue && test.SubLessonID != 0)
                {
                    subLesson = await _subLessonService.GetSubLessonByIdAsync(test.SubLessonID.Value);
                    if (subLesson == null)
                        throw new ArgumentException("Alt ders bulunamadı.", nameof(test.SubLessonID));

                    lesson = await _lessonService.GetLessonByIdAsync(subLesson.LessonID);
                    if (lesson == null)
                        throw new ArgumentException("Ders bulunamadı.", nameof(subLesson.LessonID));

                    course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                    if (course == null)
                        throw new ArgumentException("Kurs bulunamadı.", nameof(lesson.CourseID));
                }
                else if (test.LessonID.HasValue && test.LessonID != 0)
                {
                    lesson = await _lessonService.GetLessonByIdAsync(test.LessonID.Value);
                    if (lesson == null)
                        throw new ArgumentException("Ders bulunamadı.", nameof(test.LessonID));

                    course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                    if (course == null)
                        throw new ArgumentException("Kurs bulunamadı.", nameof(lesson.CourseID));
                }
                else
                {
                    throw new InvalidOperationException("Test bir ders veya alt derse bağlı değil.");
                }

                var filteredQuestions = (await _testQuestionService.GetAllTestQuestionsAsync())
                    .Where(q => q.TestID == request.TestId)
                    .ToList();

                var questionOptions = await _testQuestionOptionService.GetAllTestQuestionOptionsAsync();

                var studentAnswers = (await _testAnswerService.GetAllTestAnswersAsync())
                    .Where(a => a.StudentID == request.StudentId && a.TestID == request.TestId)
                    .ToList();

                testResponse = new TestResponse
                {
                    TestID = test.TestID,
                    LessonID = test.LessonID,
                    SubLessonID = test.SubLessonID,
                    Title = test.Title,
                    Description = test.Description,
                    CreateDate = test.CreateDate,
                    IsSolved = test.IsSolved,
                    TestType = test.TestType,
                    TestQuestions = new List<TestQuestionResponse>()
                };

                foreach (var question in filteredQuestions)
                {
                    var questionResponse = new TestQuestionResponse
                    {
                        QuestionID = question.QuestionID,
                        TestID = question.TestID,
                        QuestionText = question.QuestionText,
                        NumberOfQuestion = $"{testResponse.TestQuestions.Count + 1}. Soru",
                        TestQuestionOptions = new List<TestQuestionOptionResponse>()
                    };

                    var filteredQuestionOptions = questionOptions
                        .Where(qo => qo.QuestionID == question.QuestionID)
                        .ToList();

                    foreach (var option in filteredQuestionOptions)
                    {
                        bool? isSelected = null;

                        if (test.IsSolved)
                        {
                            var selectedAnswer = studentAnswers
                                .FirstOrDefault(a => a.QuestionID == question.QuestionID);

                            isSelected = selectedAnswer?.SelectedOptionID == option.OptionID;
                        }

                        var optionResponse = new TestQuestionOptionResponse
                        {
                            OptionID = option.OptionID,
                            QuestionID = option.QuestionID,
                            OptionText = option.OptionText,
                            IsCorrect = option.IsCorrect,
                            isSelected = isSelected
                        };

                        questionResponse.TestQuestionOptions.Add(optionResponse);
                    }

                    testResponse.TestQuestions.Add(questionResponse);
                }
            }

            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 7);
            if (systemPrompt == null)
                throw new InvalidOperationException("Test asistanı için prompt (ContentType 7) bulunamadı.");

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
                studentAge--;

            // Prompt için kullanılacak başlık, SubLesson veya Lesson'a göre belirlenir
            var contentTitle = subLesson != null ? subLesson.Title : lesson.Title;
            var testDataJson = JsonConvert.SerializeObject(new List<TestResponse> { testResponse });

            var promptText = systemPrompt.PromptText
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", course.Name)
                .Replace("[LESSON]", contentTitle)
                .Replace("[TEST_DATA]", testDataJson);

            var messages = await _chatContextService.BuildMessageContextAsync(
                request.StudentId,
                "TestAssistantRobot",
                promptText,
                request.UserMessage
            );

            var result = await _chatGptService.SendAiRequestAsync(messages);

            var parent = await _userService.GetByIdAsync(student.UserID);

            await _chatContextService.SaveNewMessagePairAsync(
                request.StudentId,
                "TestAssistantRobot",
                request.UserMessage,
                result
            );

            var newAnalizeMessageContentRequest = new AnalizeMessageContentRequest
            {
                ParentMail = parent.Email,
                ParentName = parent.FirstName,
                ParentLastName = parent.LastName,
                StudentName = student.FirstName,
                StudentLastName = student.LastName,
            };

            _ = Task.Run(() => _chatGptService.AnalyzeMessageContentAsync(request.UserMessage, newAnalizeMessageContentRequest));

            return new AskTestAssistantRobotResponse { Content = result };
        }

        public async Task<List<QuizResponse>> GetAllQuizzes(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(studentId));

            var quizzes = await _quizService.GetAllQuizzesByStudentIdAsync(studentId);
            return quizzes.Select(q => new QuizResponse
            {
                QuizID = q.QuizID,
                SubLessonID = q.SubLessonID,
                LessonID = q.LessonID,
                StudentId = q.StudentId,
                Title = q.Title,
                Description = q.Description,
                CreateDate = q.CreateDate,
                IsSolved = q.IsSolved,
                QuizType = q.QuizType,
                QuizQuestions = null
            }).ToList();
        }

        public async Task<IEnumerable<QuizResponse>> GetAllQuizByStudentIdAsync(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Öğrenci bulunamadı!", nameof(studentId));

            var quizzes = await _quizService.GetAllQuizzesByStudentIdAsync(studentId);
            return quizzes.Select(q => new QuizResponse
            {
                QuizID = q.QuizID,
                SubLessonID = q.SubLessonID ?? 0,
                LessonID = q.LessonID ?? 0,
                StudentId = q.StudentId,
                QuizType = q.QuizType,
                IsSolved = q.IsSolved,
                Title = q.Title,
                Description = q.Description,
                CreateDate = q.CreateDate,
                QuizQuestions = null // detayları GetQuizByIdAsync ile yükleyeceğiz
            });
        }

        public async Task<QuizResponse> GetQuizByIdAsync(int quizId, int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Öğrenci bulunamadı!", nameof(studentId));

            var quiz = await _quizService.GetQuizByIdAsync(quizId);
            if (quiz == null || quiz.StudentId != studentId)
                throw new ArgumentException("Quiz bulunamadı veya erişim yok!", nameof(quizId));

            var allQuestions = await _quizQuestionService.GetAllQuizQuestionsAsync();
            var questions = allQuestions.Where(q => q.QuizID == quizId).ToList();

            var allOptions = await _quizQuestionOptionService.GetAllQuizQuestionOptionsAsync();
            var studentAnswers = quiz.IsSolved
                ? (await _quizAnswerService.GetAllQuizAnswersAsync())
                    .Where(a => a.StudentID == studentId && a.QuizID == quizId)
                    .ToList()
                : new List<QuizAnswer>();

            var response = new QuizResponse
            {
                QuizID = quiz.QuizID,
                SubLessonID = quiz.SubLessonID ?? 0,
                LessonID = quiz.LessonID ?? 0,
                StudentId = quiz.StudentId,
                QuizType = quiz.QuizType,
                IsSolved = quiz.IsSolved,
                Title = quiz.Title,
                Description = quiz.Description,
                CreateDate = quiz.CreateDate,
                QuizQuestions = new List<QuizQuestionResponse>()
            };

            foreach (var q in questions)
            {
                var qr = new QuizQuestionResponse
                {
                    QuestionID = q.QuestionID,
                    QuizID = q.QuizID,
                    QuestionText = q.QuestionText,
                    QuizQuestionOptions = new List<QuizQuestionOptionResponse>()
                };

                foreach (var o in allOptions.Where(o => o.QuestionID == q.QuestionID))
                {
                    bool? isSelected = null;
                    if (quiz.IsSolved)
                    {
                        var ans = studentAnswers.FirstOrDefault(a => a.QuestionID == q.QuestionID);
                        isSelected = ans?.SelectedOptionID == o.OptionID;
                    }

                    qr.QuizQuestionOptions.Add(new QuizQuestionOptionResponse
                    {
                        OptionID = o.OptionID,
                        QuestionID = o.QuestionID,
                        OptionText = o.OptionText,
                        IsCorrect = o.IsCorrect,
                        isSelected = isSelected
                    });
                }

                response.QuizQuestions.Add(qr);
            }

            return response;
        }

        public async Task<bool> UpdateProgressAsync(UpdateProgressRequest updateProgressRequest, int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(studentId));

            if (updateProgressRequest.TestType == TestTypeEnum.QuickTest || updateProgressRequest.QuizType == QuizTypeEnum.QuickQuiz)
            {
                if (updateProgressRequest.SubLessonID.HasValue && updateProgressRequest.SubLessonID != 0)
                {
                    var subLesson = await _subLessonService.GetSubLessonByIdAsync(updateProgressRequest.SubLessonID.Value);
                    if (subLesson == null)
                        throw new ArgumentException("SubLesson not found!", nameof(updateProgressRequest.SubLessonID));

                    var subLessonProgress = await _subLessonProgressService.GetSubLessonProgressByStudentIdAsync(studentId, updateProgressRequest.SubLessonID.Value)
                        ?? new SubLessonProgress
                        {
                            StudentID = studentId,
                            SubLessonID = updateProgressRequest.SubLessonID.Value,
                            LessonID = subLesson.LessonID,
                            ProgressID = 0,
                            IsCompleted = false,
                            Progress = 0,
                            ProgressType = ProgressTypeEnum.Course,
                        };

                    subLessonProgress.IsCompleted = true;
                    subLessonProgress.Progress = subLessonProgress.Progress >= 50 ? 100 : 50;
                    subLessonProgress.CompletionDate = subLessonProgress.IsCompleted ? DateTime.UtcNow : null;

                    if (subLessonProgress.ProgressID == 0)
                        await _subLessonProgressService.CreateSubLessonProgressAsync(subLessonProgress);
                    else
                        await _subLessonProgressService.UpdateSubLessonProgressAsync(subLessonProgress);

                    var lesson = await _lessonService.GetLessonByIdAsync(subLesson.LessonID);
                    if (lesson == null)
                        throw new ArgumentException("Lesson not found!", nameof(subLesson.LessonID));

                    var relatedSubLessons = await _subLessonService.GetSubLessonByLessonIdAsync(lesson.LessonID);
                    var subLessonProgresses = new List<SubLessonProgress>();

                    foreach (var sl in relatedSubLessons)
                    {
                        var progress = await _subLessonProgressService.GetSubLessonProgressByStudentIdAsync(studentId, sl.SubLessonID);
                        if (progress != null && progress.ProgressType == ProgressTypeEnum.Course)
                            subLessonProgresses.Add(progress);
                    }

                    int totalSubLessons = relatedSubLessons.Count;
                    int completedSubLessons = subLessonProgresses.Count(p => p.IsCompleted);
                    int lessonProgress = totalSubLessons > 0 ? (completedSubLessons * 100) / totalSubLessons : 0;

                    var lessonProgressEntity = await _lessonProgressService.GetLessonProgressByStudentIdAsync(studentId, lesson.LessonID, ProgressTypeEnum.Course)
                        ?? new LessonProgress
                        {
                            StudentID = studentId,
                            LessonID = lesson.LessonID,
                            CourseID = lesson.CourseID,
                            Progress = 0,
                            IsCompleted = false,
                            ProgressType = ProgressTypeEnum.Course,
                        };

                    lessonProgressEntity.Progress = lessonProgress;
                    lessonProgressEntity.IsCompleted = totalSubLessons > 0 && completedSubLessons == totalSubLessons;
                    lessonProgressEntity.CompletionDate = lessonProgressEntity.IsCompleted ? DateTime.UtcNow : null;

                    if (lessonProgressEntity.ProgressID == 0)
                        await _lessonProgressService.CreateLessonProgressAsync(lessonProgressEntity);
                    else
                        await _lessonProgressService.UpdateLessonProgressAsync(lessonProgressEntity);

                    var course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                    if (course == null)
                        throw new ArgumentException("Course not found!", nameof(lesson.CourseID));

                    var relatedLessons = await _lessonService.GetLessonByCourseIdAsync(course.CourseID);
                    var allSubLessons = new List<SubLesson>();
                    var allSubLessonProgresses = new List<SubLessonProgress>();

                    foreach (var l in relatedLessons)
                    {
                        var subLessons = await _subLessonService.GetSubLessonByLessonIdAsync(l.LessonID);
                        allSubLessons.AddRange(subLessons);

                        foreach (var sl in subLessons)
                        {
                            var progress = await _subLessonProgressService.GetSubLessonProgressByStudentIdAsync(studentId, sl.SubLessonID);
                            if (progress != null && progress.ProgressType == ProgressTypeEnum.Course)
                                allSubLessonProgresses.Add(progress);
                        }
                    }

                    int totalCourseSubLessons = allSubLessons.Count;
                    int completedCourseSubLessons = allSubLessonProgresses.Count(p => p.IsCompleted);
                    int courseProgress = totalCourseSubLessons > 0 ? (completedCourseSubLessons * 100) / totalCourseSubLessons : 0;

                    var courseProgressEntity = await _courseProgressService.GetCourseProgressByStudentIdAsync(studentId, course.CourseID, ProgressTypeEnum.Course)
                        ?? new CourseProgress
                        {
                            StudentID = studentId,
                            CourseID = course.CourseID,
                            Progress = 0,
                            IsCompleted = false,
                            ProgressType = ProgressTypeEnum.Course,
                        };

                    courseProgressEntity.Progress = courseProgress;
                    courseProgressEntity.IsCompleted = totalCourseSubLessons > 0 && completedCourseSubLessons == totalCourseSubLessons;
                    courseProgressEntity.CompletionDate = courseProgressEntity.IsCompleted ? DateTime.UtcNow : null;

                    if (courseProgressEntity.ProgressID == 0)
                        await _courseProgressService.CreateCourseProgressAsync(courseProgressEntity);
                    else
                        await _courseProgressService.UpdateCourseProgressAsync(courseProgressEntity);

                    return true;
                }
            }

            // test progress
            if (updateProgressRequest.TestType != TestTypeEnum.QuickTest || updateProgressRequest.QuizType != QuizTypeEnum.QuickQuiz)
            {
                // normal test/quiz progress
                if (updateProgressRequest.SubLessonID.HasValue && updateProgressRequest.SubLessonID != 0)
                {
                    var subLesson = await _subLessonService.GetSubLessonByIdAsync(updateProgressRequest.SubLessonID.Value);
                    if (subLesson == null)
                        throw new ArgumentException("SubLesson not found!", nameof(updateProgressRequest.SubLessonID));

                    var lesson = await _lessonService.GetLessonByIdAsync(subLesson.LessonID);
                    if (lesson == null)
                        throw new ArgumentException("Lesson not found!", nameof(subLesson.LessonID));

                    var course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                    if (course == null)
                        throw new ArgumentException("Course not found!", nameof(lesson.CourseID));

                    var allTests = await _testService.GetAllTestAsync();
                    var allQuizzes = await _quizService.GetAllQuizzesAsync();

                    var relatedSubLessons = await _subLessonService.GetSubLessonByLessonIdAsync(lesson.LessonID);
                    int totalTestsPerSubLesson = 4; // 2 tests + 2 quizzes
                    int totalGeneralTests = 6; // 3 general tests + 3 general quizzes
                    int totalLessonTests = (relatedSubLessons.Count * totalTestsPerSubLesson) + totalGeneralTests;

                    int totalCompletedTests = 0;
                    foreach (var sl in relatedSubLessons)
                    {
                        var tests = allTests.Where(t => t.SubLessonID == sl.SubLessonID && t.StudentId == studentId);
                        var quizzes = allQuizzes.Where(q => q.SubLessonID == sl.SubLessonID && q.StudentId == studentId);

                        totalCompletedTests += tests.Count(t => t.IsSolved);
                        totalCompletedTests += quizzes.Count(q => q.IsSolved);
                    }

                    var generalTests = allTests.Where(t => t.LessonID == lesson.LessonID && t.SubLessonID == null && t.StudentId == studentId);
                    var generalQuizzes = allQuizzes.Where(q => q.LessonID == lesson.LessonID && q.SubLessonID == null && q.StudentId == studentId);

                    totalCompletedTests += generalTests.Count(t => t.IsSolved);
                    totalCompletedTests += generalQuizzes.Count(q => q.IsSolved);

                    int lessonProgress = totalLessonTests > 0 ? (totalCompletedTests * 100) / totalLessonTests : 0;
                    var lessonProgressEntity = await _lessonProgressService.GetLessonProgressByStudentIdAsync(studentId, lesson.LessonID, ProgressTypeEnum.Test)
                        ?? new LessonProgress
                        {
                            StudentID = studentId,
                            LessonID = lesson.LessonID,
                            CourseID = lesson.CourseID,
                            Progress = 0,
                            IsCompleted = false,
                            ProgressType = ProgressTypeEnum.Test,
                        };

                    lessonProgressEntity.Progress = lessonProgress;
                    lessonProgressEntity.IsCompleted = totalCompletedTests == totalLessonTests;
                    lessonProgressEntity.CompletionDate = lessonProgressEntity.IsCompleted ? DateTime.UtcNow : null;

                    if (lessonProgressEntity.ProgressID == 0)
                        await _lessonProgressService.CreateLessonProgressAsync(lessonProgressEntity);
                    else
                        await _lessonProgressService.UpdateLessonProgressAsync(lessonProgressEntity);

                    var relatedLessons = await _lessonService.GetLessonByCourseIdAsync(course.CourseID);
                    int totalCourseTests = 0;
                    int totalCourseCompletedTests = 0;

                    foreach (var l in relatedLessons)
                    {
                        var subLessons = await _subLessonService.GetSubLessonByLessonIdAsync(l.LessonID);
                        totalCourseTests += (subLessons.Count * totalTestsPerSubLesson) + totalGeneralTests;

                        foreach (var sl in subLessons)
                        {
                            var tests = allTests.Where(t => t.SubLessonID == sl.SubLessonID && t.StudentId == studentId);
                            var quizzes = allQuizzes.Where(q => q.SubLessonID == sl.SubLessonID && q.StudentId == studentId);

                            totalCourseCompletedTests += tests.Count(t => t.IsSolved);
                            totalCourseCompletedTests += quizzes.Count(q => q.IsSolved);
                        }

                        var gTests = allTests.Where(t => t.LessonID == l.LessonID && t.SubLessonID == null && t.StudentId == studentId);
                        var gQuizzes = allQuizzes.Where(q => q.LessonID == l.LessonID && q.SubLessonID == null && q.StudentId == studentId);

                        totalCourseCompletedTests += gTests.Count(t => t.IsSolved);
                        totalCourseCompletedTests += gQuizzes.Count(q => q.IsSolved);
                    }

                    int courseProgress = totalCourseTests > 0 ? (totalCourseCompletedTests * 100) / totalCourseTests : 0;
                    var courseProgressEntity = await _courseProgressService.GetCourseProgressByStudentIdAsync(studentId, course.CourseID, ProgressTypeEnum.Test)
                        ?? new CourseProgress
                        {
                            StudentID = studentId,
                            CourseID = course.CourseID,
                            Progress = 0,
                            IsCompleted = false,
                            ProgressType = ProgressTypeEnum.Test,
                        };

                    courseProgressEntity.Progress = courseProgress;
                    courseProgressEntity.IsCompleted = totalCourseCompletedTests == totalCourseTests;
                    courseProgressEntity.CompletionDate = courseProgressEntity.IsCompleted ? DateTime.UtcNow : null;

                    if (courseProgressEntity.ProgressID == 0)
                        await _courseProgressService.CreateCourseProgressAsync(courseProgressEntity);
                    else
                        await _courseProgressService.UpdateCourseProgressAsync(courseProgressEntity);

                    return true;
                }

                // general test/quiz progress
                if (updateProgressRequest.LessonID.HasValue && updateProgressRequest.LessonID != 0)
                {
                    var lesson = await _lessonService.GetLessonByIdAsync(updateProgressRequest.LessonID.Value);
                    if (lesson == null)
                        throw new ArgumentException("Lesson not found!", nameof(updateProgressRequest.LessonID));

                    var course = await _courseService.GetCourseByIdAsync(lesson.CourseID);
                    if (course == null)
                        throw new ArgumentException("Course not found!", nameof(lesson.CourseID));

                    var allTests = await _testService.GetAllTestAsync();
                    var allQuizzes = await _quizService.GetAllQuizzesAsync();

                    var relatedSubLessons = await _subLessonService.GetSubLessonByLessonIdAsync(lesson.LessonID);
                    int totalTestsPerSubLesson = 4; // 2 tests + 2 quizzes
                    int totalGeneralTests = 6; // 3 general tests + 3 general quizzes
                    int totalLessonTests = (relatedSubLessons.Count * totalTestsPerSubLesson) + totalGeneralTests;

                    int totalCompletedTests = 0;
                    foreach (var sl in relatedSubLessons)
                    {
                        var tests = allTests.Where(t => t.SubLessonID == sl.SubLessonID && t.StudentId == studentId);
                        var quizzes = allQuizzes.Where(q => q.SubLessonID == sl.SubLessonID && q.StudentId == studentId);

                        totalCompletedTests += tests.Count(t => t.IsSolved);
                        totalCompletedTests += quizzes.Count(q => q.IsSolved);
                    }

                    var generalTests = allTests.Where(t => t.LessonID == lesson.LessonID && t.SubLessonID == null && t.StudentId == studentId);
                    var generalQuizzes = allQuizzes.Where(q => q.LessonID == lesson.LessonID && q.SubLessonID == null && q.StudentId == studentId);

                    totalCompletedTests += generalTests.Count(t => t.IsSolved);
                    totalCompletedTests += generalQuizzes.Count(q => q.IsSolved);

                    int lessonProgress = totalLessonTests > 0 ? (totalCompletedTests * 100) / totalLessonTests : 0;
                    var lessonProgressEntity = await _lessonProgressService.GetLessonProgressByStudentIdAsync(studentId, lesson.LessonID, ProgressTypeEnum.Test)
                        ?? new LessonProgress
                        {
                            StudentID = studentId,
                            LessonID = lesson.LessonID,
                            CourseID = lesson.CourseID,
                            Progress = 0,
                            IsCompleted = false,
                            ProgressType = ProgressTypeEnum.Test,
                        };

                    lessonProgressEntity.Progress = lessonProgress;
                    lessonProgressEntity.IsCompleted = totalCompletedTests == totalLessonTests;
                    lessonProgressEntity.CompletionDate = lessonProgressEntity.IsCompleted ? DateTime.UtcNow : null;

                    if (lessonProgressEntity.ProgressID == 0)
                        await _lessonProgressService.CreateLessonProgressAsync(lessonProgressEntity);
                    else
                        await _lessonProgressService.UpdateLessonProgressAsync(lessonProgressEntity);

                    var relatedLessons = await _lessonService.GetLessonByCourseIdAsync(course.CourseID);
                    int totalCourseTests = 0;
                    int totalCourseCompletedTests = 0;

                    foreach (var l in relatedLessons)
                    {
                        var subLessons = await _subLessonService.GetSubLessonByLessonIdAsync(l.LessonID);
                        totalCourseTests += (subLessons.Count * totalTestsPerSubLesson) + totalGeneralTests;

                        foreach (var sl in subLessons)
                        {
                            var tests = allTests.Where(t => t.SubLessonID == sl.SubLessonID && t.StudentId == studentId);
                            var quizzes = allQuizzes.Where(q => q.SubLessonID == sl.SubLessonID && q.StudentId == studentId);

                            totalCourseCompletedTests += tests.Count(t => t.IsSolved);
                            totalCourseCompletedTests += quizzes.Count(q => q.IsSolved);
                        }

                        var gTests = allTests.Where(t => t.LessonID == l.LessonID && t.SubLessonID == null && t.StudentId == studentId);
                        var gQuizzes = allQuizzes.Where(q => q.LessonID == l.LessonID && q.SubLessonID == null && q.StudentId == studentId);

                        totalCourseCompletedTests += gTests.Count(t => t.IsSolved);
                        totalCourseCompletedTests += gQuizzes.Count(q => q.IsSolved);
                    }

                    int courseProgress = totalCourseTests > 0 ? (totalCourseCompletedTests * 100) / totalCourseTests : 0;
                    var courseProgressEntity = await _courseProgressService.GetCourseProgressByStudentIdAsync(studentId, course.CourseID, ProgressTypeEnum.Test)
                        ?? new CourseProgress
                        {
                            StudentID = studentId,
                            CourseID = course.CourseID,
                            Progress = 0,
                            IsCompleted = false,
                            ProgressType = ProgressTypeEnum.Test,
                        };

                    courseProgressEntity.Progress = courseProgress;
                    courseProgressEntity.IsCompleted = totalCourseCompletedTests == totalCourseTests;
                    courseProgressEntity.CompletionDate = courseProgressEntity.IsCompleted ? DateTime.UtcNow : null;

                    if (courseProgressEntity.ProgressID == 0)
                        await _courseProgressService.CreateCourseProgressAsync(courseProgressEntity);
                    else
                        await _courseProgressService.UpdateCourseProgressAsync(courseProgressEntity);

                    return true;
                }
            }

            return false;
        }

        public async Task<TestProcessResponse> GetAllTestProcessByStudentId(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(studentId));

            var response = new TestProcessResponse
            {
                StudentID = studentId,
                CourseProcess = new List<CourseProgressResponse>()
            };

            var allCourses = await _courseService.GetAllCourseAsync();
            var filteredCourses = allCourses.Where(c => c.ClassLevel == student.Class).ToList();

            foreach (var course in filteredCourses)
            {
                var courseProgress = await _courseProgressService.GetCourseProgressByStudentIdAsync(studentId, course.CourseID, ProgressTypeEnum.Test);

                var courseProgressResponse = new CourseProgressResponse
                {
                    CourseID = course.CourseID,
                    IsCompleted = courseProgress?.IsCompleted ?? false,
                    CompletionDate = courseProgress?.CompletionDate,
                    Progress = courseProgress?.Progress ?? 0,
                    LessonsProgress = new List<LessonProgressResponse>()
                };

                var lessons = await _lessonService.GetLessonByCourseIdAsync(course.CourseID);

                foreach (var lesson in lessons)
                {
                    var lessonProgress = await _lessonProgressService.GetLessonProgressByStudentIdAsync(studentId, lesson.LessonID, ProgressTypeEnum.Test);

                    var lessonProgressResponse = new LessonProgressResponse
                    {
                        LessonID = lesson.LessonID,
                        IsCompleted = lessonProgress?.IsCompleted ?? false,
                        CompletionDate = lessonProgress?.CompletionDate,
                        Progress = lessonProgress?.Progress ?? 0
                    };

                    courseProgressResponse.LessonsProgress.Add(lessonProgressResponse);
                }

                response.CourseProcess.Add(courseProgressResponse);
            }

            return response;
        }
    }
}