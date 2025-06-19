using AutoMapper;
using Metalink.Application.Interfaces;
using Metalink.Domain.Interfaces;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Configuration;
using MetaLink.Domain.Enums;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Metalink.Domain.Entities;
using Metalink.Domain.Enums;
using Microsoft.IdentityModel.Tokens;

namespace Metalink.Application.AppServices
{
    public class EducationContentAppService : IEducationContentAppService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly IMapper _mapper;
        private readonly IChatGptService _chatGptService;
        private readonly IAiPromptService _aiPromptService;
        private readonly IAIGeneratedContentService _aIGeneratedContentService;
        private readonly ILessonService _lessonService;
        private readonly ISubLessonService _subLessonService;
        private readonly IStudentService _studentService;
        private readonly IChatContextService _chatContextService;
        private readonly IUserService _userService;
        private readonly IWebHostEnvironment _environment;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IReviewSessionService _reviewSessionService;
        private readonly ICourseService _courseService;

        public EducationContentAppService(
            HttpClient httpClient,
            IConfiguration configuration,
            IMapper mapper,
            IChatGptService chatGptService,
            IAiPromptService aiPromptService,
            ILessonService lessonService,
            ISubLessonService subLessonService,
            IStudentService studentService,
            IAIGeneratedContentService aIGeneratedContentService,
            IChatContextService chatContextService,
            IUserService userService,
            IWebHostEnvironment environment,
            IServiceScopeFactory serviceScopeFactory,
            IReviewSessionService reviewSessionService,
            ICourseService courseService)
        {
            _serviceScopeFactory = serviceScopeFactory;
            _httpClient = httpClient;
            _apiKey = configuration["OpenAI:ApiKey"];
            _mapper = mapper;
            _chatGptService = chatGptService;
            _aiPromptService = aiPromptService;
            _lessonService = lessonService;
            _subLessonService = subLessonService;
            _studentService = studentService;
            _aIGeneratedContentService = aIGeneratedContentService;
            _chatContextService = chatContextService;
            _userService = userService;
            _environment = environment;
            _reviewSessionService = reviewSessionService;
            _courseService = courseService;
        }

        public async Task<EducationContentResponse> StudyContentBySubLessonId(EducationContentRequest request)
        {
            var student = await _studentService.GetByIdAsync(request.StudentId)
                          ?? throw new ArgumentException("Student not found", nameof(request.StudentId));
            var subLesson = await _subLessonService.GetSubLessonByIdAsync(request.SubLessonId)
                                  ?? throw new ArgumentException("SubLesson not found", nameof(request.SubLessonId));
            var contentReady = await _aIGeneratedContentService.GetAllAIGeneratedContentAsync();
            var filteredContentReady = contentReady.FirstOrDefault(c =>
                c.StudentID == request.StudentId &&
                c.SubLessonID == request.SubLessonId &&
                c.ContentType == ContentTypeEnum.LessonContent);

            if (!request.NewContent && filteredContentReady != null)
            {
                string audioUrl = null;
                var needsAudio = student.LearningStyleType == LearningStyleEnum.AuditoryLearningStyle
                              || student.LearningStyleType == LearningStyleEnum.TactileKinestheticLearningStyle;

                if (needsAudio && student.VoiceType.HasValue)
                {
                    string wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    string audioFolder = Path.Combine(wwwRootPath, "contentaudios");

                    string audioFileName = $"{filteredContentReady.ContentID}.mp3";
                    string audioFilePath = Path.Combine(audioFolder, audioFileName);

                    if (File.Exists(audioFilePath))
                    {
                        audioUrl = $"/contentaudios/{audioFileName}";
                    }
                    else
                    {
                        try
                        {
                            var bytes = await _chatGptService.SynthesizeSpeechAsync(
                                filteredContentReady.GeneratedText,
                                student.VoiceType.Value
                            );

                            if (!Directory.Exists(audioFolder))
                                Directory.CreateDirectory(audioFolder);

                            await File.WriteAllBytesAsync(audioFilePath, bytes);
                            audioUrl = $"/contentaudios/{audioFileName}";
                        }
                        catch { }
                    }
                }

                return new EducationContentResponse
                {
                    Content = filteredContentReady.GeneratedText,
                    ContentId = filteredContentReady.ContentID,
                    AudioUrl = audioUrl,
                    GeneratedImage1 = filteredContentReady.GeneratedImage1,
                    GeneratedImage2 = filteredContentReady.GeneratedImage2,
                    GeneratedImage3 = filteredContentReady.GeneratedImage3
                };
            }

            var lessons = await _lessonService.GetAllLessonAsync();
            var relatedLesson = lessons.FirstOrDefault(x => x.LessonID == subLesson.LessonID);
            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();

            bool englishNeeded = relatedLesson.CourseID is 3 or 14 or 18;

            var systemPrompt = allPrompts.FirstOrDefault(p =>
                (int)p.ContentType == 1 &&
                (englishNeeded ? p.PromptText.StartsWith("[ENG]")
                                : p.PromptText.StartsWith("[TR]")))
            ?? throw new Exception($"ContentType 1 için {(englishNeeded ? "[ENG]" : "[TR]")} prompt bulunamadı.");

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge)) studentAge--;

            var promptText = systemPrompt.PromptText
                .Replace("[ENG]", string.Empty)
                .Replace("[TR]", string.Empty)
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", relatedLesson.Title)
                .Replace("[TOPIC]", subLesson.Title)
                .Replace("[LEARNING_OBJECTIVES]", subLesson.LessonObjective);

            var messages = new List<ChatGptMessage>
            {
                new ChatGptMessage { role = "system", content = promptText }
            };

            var requestBody = new
            {
                model = "gpt-4o-mini",
                messages = messages,
                temperature = 0.7,
                max_tokens = 2000
            };

            var jsonRequest = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
            var responseAPI = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
            if (!responseAPI.IsSuccessStatusCode)
            {
                var errorResponse = await responseAPI.Content.ReadAsStringAsync();
                throw new Exception($"OpenAI API hatası: {errorResponse}");
            }

            var jsonResponse = await responseAPI.Content.ReadAsStringAsync();
            var parsedResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse);
            var result = parsedResponse.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            if (result.StartsWith("```json"))
            {
                result = result.Substring(7);
            }
            else if (result.StartsWith("```"))
            {
                result = result.Substring(3);
            }

            if (result.EndsWith("```"))
            {
                result = result.Substring(0, result.Length - 3);
            }

            string generatedText;
            try
            {
                var contentJson = JsonSerializer.Deserialize<JsonElement>(result);
                generatedText = contentJson.GetProperty("content")
                                           .GetProperty("contentText")
                                           .GetString();
            }
            catch
            {
                generatedText = result;
            }

            var newAIGenerateContent = new AIGeneratedContent
            {
                CreateDate = DateTime.Now,
                StudentID = student.StudentID,
                SubLessonID = request.SubLessonId,
                GeneratedText = generatedText,
                PromptID = systemPrompt.PromptID,
                ContentType = ContentTypeEnum.LessonContent
            };
            if (filteredContentReady != null)
            {
                newAIGenerateContent.ContentID = filteredContentReady.ContentID;
                await _aIGeneratedContentService.UpdateAIGeneratedContentAsync(newAIGenerateContent);
            }
            else
            {
                await _aIGeneratedContentService.CreateAIGeneratedContentAsync(newAIGenerateContent);
            }

            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var chatGptService = scope.ServiceProvider.GetRequiredService<IChatGptService>();

                    await chatGptService.GenerateImagesForContent(
                        relatedLesson.Title,
                        subLesson.Title,
                        studentAge,
                        result,
                        _environment,
                        aIGeneratedContent: newAIGenerateContent,
                        filteredContentReady: filteredContentReady
                    );

                    if ((student.LearningStyleType == LearningStyleEnum.AuditoryLearningStyle ||
                         student.LearningStyleType == LearningStyleEnum.TactileKinestheticLearningStyle) &&
                        student.VoiceType.HasValue)
                    {
                        var bytes = await chatGptService.SynthesizeSpeechAsync(
                            generatedText,
                            student.VoiceType.Value
                        );
                        SaveAudioToFile(bytes, newAIGenerateContent.ContentID);
                    }
                }
                catch { }
            });

            string initialAudioUrl = null;
            var needsAudioNew = student.LearningStyleType == LearningStyleEnum.AuditoryLearningStyle
                              || student.LearningStyleType == LearningStyleEnum.TactileKinestheticLearningStyle;
            if (needsAudioNew && student.VoiceType.HasValue)
            {
                try
                {
                    var bytes = await _chatGptService.SynthesizeSpeechAsync(
                        generatedText,
                        student.VoiceType.Value
                    );
                    initialAudioUrl = SaveAudioToFile(bytes, newAIGenerateContent.ContentID);
                }
                catch { }
            }

            return new EducationContentResponse
            {
                Content = generatedText,
                ContentId = newAIGenerateContent.ContentID,
                AudioUrl = initialAudioUrl,
                GeneratedImage1 = null,
                GeneratedImage2 = null,
                GeneratedImage3 = null
            };
        }

        private string SaveAudioToFile(byte[] audioBytes, int contentId)
        {
            var folder = Path.Combine(_environment.WebRootPath, "contentaudios");
            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            var fileName = $"{contentId}.mp3";
            var filePath = Path.Combine(folder, fileName);
            File.WriteAllBytes(filePath, audioBytes);

            return $"/contentaudios/{fileName}";
        }

        public async Task<EducationContentResponse> StudySummaryBySubLessonId(EducationContentRequest request)
        {
            var student = await _studentService.GetByIdAsync(request.StudentId)
                          ?? throw new ArgumentException("Student not found", nameof(request.StudentId));
            var subLesson = await _subLessonService.GetSubLessonByIdAsync(request.SubLessonId)
                                  ?? throw new ArgumentException("SubLesson not found", nameof(request.SubLessonId));
            var contentReady = await _aIGeneratedContentService.GetAllAIGeneratedContentAsync();
            var filteredContentReady = contentReady.FirstOrDefault(c =>
                c.StudentID == request.StudentId &&
                c.SubLessonID == request.SubLessonId &&
                c.ContentType == ContentTypeEnum.LessonSummary);

            if (!request.NewContent && filteredContentReady != null)
            {
                string audioUrl = null;
                var needsAudio = student.LearningStyleType == LearningStyleEnum.AuditoryLearningStyle
                              || student.LearningStyleType == LearningStyleEnum.TactileKinestheticLearningStyle;

                if (needsAudio && student.VoiceType.HasValue)
                {
                    string wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    string audioFolder = Path.Combine(wwwRootPath, "contentaudios");

                    string audioFileName = $"{filteredContentReady.ContentID}.mp3";
                    string audioFilePath = Path.Combine(audioFolder, audioFileName);

                    if (File.Exists(audioFilePath))
                    {
                        audioUrl = $"/contentaudios/{audioFileName}";
                    }
                    else
                    {
                        try
                        {
                            var bytes = await _chatGptService.SynthesizeSpeechAsync(
                                filteredContentReady.GeneratedText,
                                student.VoiceType.Value
                            );

                            if (!Directory.Exists(audioFolder))
                                Directory.CreateDirectory(audioFolder);

                            await File.WriteAllBytesAsync(audioFilePath, bytes);

                            audioUrl = $"/contentaudios/{audioFileName}";
                        }
                        catch { }
                    }
                }

                return new EducationContentResponse
                {
                    Content = filteredContentReady.GeneratedText,
                    ContentId = filteredContentReady.ContentID,
                    AudioUrl = audioUrl,
                    GeneratedImage1 = filteredContentReady.GeneratedImage1,
                    GeneratedImage2 = filteredContentReady.GeneratedImage2,
                    GeneratedImage3 = filteredContentReady.GeneratedImage3
                };
            }

            var lessons = await _lessonService.GetAllLessonAsync();
            var relatedLesson = lessons.First(l => l.LessonID == subLesson.LessonID);
            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();

            bool englishNeeded = relatedLesson.CourseID is 3 or 14 or 18;

            var systemPrompt = allPrompts.FirstOrDefault(p =>
        (int)p.ContentType == 0 &&
        (englishNeeded ? p.PromptText.StartsWith("[ENG]")
                        : p.PromptText.StartsWith("[TR]")))
    ?? throw new Exception($"ContentType 0 için {(englishNeeded ? "[ENG]" : "[TR]")} prompt bulunamadı.");

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge)) studentAge--;
            var promptText = systemPrompt.PromptText
                .Replace("[ENG]", string.Empty)
                .Replace("[TR]", string.Empty)
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", relatedLesson.Title)
                .Replace("[TOPIC]", subLesson.Title)
                .Replace("[LEARNING_OBJECTIVES]", subLesson.LessonObjective);

            var messages = new List<ChatGptMessage> { new() { role = "system", content = promptText } };
            var requestBody = new { model = "gpt-4o-mini", messages, temperature = 0.7, max_tokens = 1500 };
            var jsonRequest = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
            var responseAPI = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
            if (!responseAPI.IsSuccessStatusCode)
            {
                var errorResponse = await responseAPI.Content.ReadAsStringAsync();
                throw new Exception($"OpenAI API hatası: {errorResponse}");
            }

            var jsonResponse = await responseAPI.Content.ReadAsStringAsync();
            var parsedResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse);
            var result = parsedResponse.GetProperty("choices")[0]
                                       .GetProperty("message")
                                       .GetProperty("content")
                                       .GetString();

            string generatedText;
            try
            {
                var contentJson = JsonSerializer.Deserialize<JsonElement>(result);
                generatedText = contentJson.GetProperty("content")
                                           .GetProperty("contentText")
                                           .GetString();
            }
            catch
            {
                generatedText = result;
            }

            var newAIGenerateContent = new AIGeneratedContent
            {
                CreateDate = DateTime.Now,
                StudentID = student.StudentID,
                SubLessonID = request.SubLessonId,
                GeneratedText = generatedText,
                PromptID = systemPrompt.PromptID,
                ContentType = ContentTypeEnum.LessonSummary
            };
            if (filteredContentReady != null)
            {
                newAIGenerateContent.ContentID = filteredContentReady.ContentID;
                await _aIGeneratedContentService.UpdateAIGeneratedContentAsync(newAIGenerateContent);
            }
            else
            {
                await _aIGeneratedContentService.CreateAIGeneratedContentAsync(newAIGenerateContent);
            }

            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var chatGptService = scope.ServiceProvider.GetRequiredService<IChatGptService>();

                    await chatGptService.GenerateImagesForContent(
                        relatedLesson.Title,
                        subLesson.Title,
                        studentAge,
                        result,
                        _environment,
                        aIGeneratedContent: newAIGenerateContent,
                        filteredContentReady: filteredContentReady
                    );

                    if ((student.LearningStyleType == LearningStyleEnum.AuditoryLearningStyle ||
                         student.LearningStyleType == LearningStyleEnum.TactileKinestheticLearningStyle) &&
                        student.VoiceType.HasValue)
                    {
                        var bytes = await chatGptService.SynthesizeSpeechAsync(
                            generatedText,
                            student.VoiceType.Value
                        );
                        SaveAudioToFile(bytes, newAIGenerateContent.ContentID);
                    }
                }
                catch { }
            });

            string initialAudioUrl = null;
            var needsAudioNew = student.LearningStyleType == LearningStyleEnum.AuditoryLearningStyle
                              || student.LearningStyleType == LearningStyleEnum.TactileKinestheticLearningStyle;
            if (needsAudioNew && student.VoiceType.HasValue)
            {
                try
                {
                    var bytes = await _chatGptService.SynthesizeSpeechAsync(
                        generatedText,
                        student.VoiceType.Value
                    );
                    initialAudioUrl = SaveAudioToFile(bytes, newAIGenerateContent.ContentID);
                }
                catch { }
            }

            return new EducationContentResponse
            {
                Content = generatedText,
                ContentId = newAIGenerateContent.ContentID,
                AudioUrl = initialAudioUrl,
                GeneratedImage1 = null,
                GeneratedImage2 = null,
                GeneratedImage3 = null
            };
        }

        public async Task<EducationContentResponse> GetImageStatus(int contentId)
        {
            var content = await _aIGeneratedContentService.GetAIGeneratedContentByIdAsync(contentId);
            if (content == null)
            {
                throw new Exception("İçerik bulunamadı.");
            }

            return new EducationContentResponse
            {
                ContentId = contentId,
                GeneratedImage1 = content.GeneratedImage1,
                GeneratedImage2 = content.GeneratedImage2,
                GeneratedImage3 = content.GeneratedImage3
            };
        }

        public async Task<EducationContentResponse> AskQuestionContentAssistantRobot(EducationContentRequest request)
        {
            var student = await _studentService.GetByIdAsync(request.StudentId);
            var parent = await _userService.GetByIdAsync(student.UserID);
            var subLesson = await _subLessonService.GetSubLessonByIdAsync(request.SubLessonId);
            var contentReady = await _aIGeneratedContentService.GetAllAIGeneratedContentAsync();
            var filteredContentReady = contentReady.FirstOrDefault(c => c.StudentID == request.StudentId && c.SubLessonID == request.SubLessonId);
            var lessons = await _lessonService.GetAllLessonAsync();
            var relatedLesson = lessons.FirstOrDefault(x => x.LessonID == subLesson.LessonID);
            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 5);

            if (systemPrompt == null)
            {
                throw new Exception("ContentType 5 olan prompt bulunamadı.");
            }

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
            {
                studentAge--;
            }

            var promptText = systemPrompt.PromptText
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", relatedLesson.Title)
                .Replace("[TOPIC]", subLesson.Title)
                .Replace("[LEARNING_OBJECTIVES]", subLesson.LessonObjective)
                .Replace("[LESSON_CONTENT]", filteredContentReady?.GeneratedText ?? "");

            var messages = await _chatContextService.BuildMessageContextAsync(
                request.StudentId,
                "ContentAssistantRobot",
                promptText,
                request.UserMessage
            );

            var result = await _chatGptService.SendAiRequestAsync(messages);

            var newAnalizeMessageContentRequest = new AnalizeMessageContentRequest
            {
                ParentMail = parent.Email,
                ParentName = parent.FirstName,
                ParentLastName = parent.LastName,
                StudentName = student.FirstName,
                StudentLastName = student.LastName,
            };

            _ = Task.Run(() => _chatGptService.AnalyzeMessageContentAsync(request.UserMessage, newAnalizeMessageContentRequest));

            await _chatContextService.SaveNewMessagePairAsync(
                request.StudentId,
                "ContentAssistantRobot",
                request.UserMessage,
                result
            );

            return new EducationContentResponse { Content = result };
        }

        public async Task<List<ReviewSessionResponse>> GetReviewSessionDatas(int studentId, int courseId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(studentId));

            var course = await _courseService.GetCourseByIdAsync(courseId);
            if (course == null)
                throw new ArgumentException("Course not found!", nameof(courseId));

            var reviewSessions = await _reviewSessionService.GetReviewSessionByStudentIdAsync(studentId);

            var allLessons = await _lessonService.GetLessonByCourseIdAsync(courseId);

            var allSublessons = await _subLessonService.GetAllSubLessonAsync();
            var courseSublessons = allSublessons
                .Where(sl => allLessons.Any(l => l.LessonID == sl.LessonID))
                .OrderBy(sl => sl.CreateDate)
                .ToList();

            var filteredReviewSessions = reviewSessions
                .Where(rs => courseSublessons.Any(sl => sl.SubLessonID == rs.SubLessonId))
                .ToList();

            var sortedReviewSessions = filteredReviewSessions
                .OrderBy(rs => courseSublessons.FindIndex(sl => sl.SubLessonID == rs.SubLessonId))
                .ToList();

            var filteredByType = sortedReviewSessions
                .Where(rs => rs.ReviewSessionType == ReviewSessionTypeEnum.Both && !rs.IsCompleted)
                .ToList();

            var response = filteredByType.Select(rs =>
            {
                var subLesson = courseSublessons.FirstOrDefault(sl => sl.SubLessonID == rs.SubLessonId);
                var lesson = allLessons.FirstOrDefault(l => l.LessonID == subLesson?.LessonID);

                return new ReviewSessionResponse
                {
                    ReviewSessionId = rs.ReviewSessionId,
                    StudentId = rs.StudentId,
                    SubLessonId = rs.SubLessonId,
                    SubLessonName = subLesson != null ? $"{course.Name} - {lesson?.Title} - {subLesson.Title}" : "Unknown SubLesson",
                    ReviewSessionData = new ReviewSessionDataResponse
                    {
                        FailCount = rs.FailCount,
                        ReviewSessionType = rs.ReviewSessionType,
                        IsTestSolved = rs.IsTestSolved,
                        IsCompleted = rs.IsCompleted,
                        TestJsonData = rs.TestJsonData,
                        TestAnswerJsonData = rs.TestAnswerJsonData,
                        ContentText = rs.ContentText,
                        SummaryText = rs.SummaryText,
                        ContentImageOne = rs.ContentImageOne,
                        ContentImageTwo = rs.ContentImageTwo,
                        ContentImageThree = rs.ContentImageThree,
                        SummaryImageOne = rs.SummaryImageOne,
                        SummaryImageTwo = rs.SummaryImageTwo,
                        CreateDate = rs.CreateDate
                    }
                };
            }).ToList();

            return response;
        }

        public async Task<ReviewSessionResponse> StudyReviewContentAndSummaryBySubLessonId(ReviewSessionRequest request)
        {
            var student = await _studentService.GetByIdAsync(request.StudentId);
            if (student == null)
                throw new ArgumentException("Student not found!", nameof(request.StudentId));

            var subLesson = await _subLessonService.GetSubLessonByIdAsync(request.SubLessonId);
            var contentReady = await _reviewSessionService.GetReviewSessionByStudentIdAsync(request.StudentId);
            var filteredContentReady = contentReady.FirstOrDefault(c =>
                c.StudentId == request.StudentId &&
                c.SubLessonId == request.SubLessonId);

            if (!request.NewContent && filteredContentReady != null && !filteredContentReady.ContentText.IsNullOrEmpty())
            {
                if (filteredContentReady.IsCompleted)
                {
                    throw new ArgumentException("Is compleated you cant study again!", nameof(filteredContentReady.IsCompleted));
                }

                return new ReviewSessionResponse
                {
                    StudentId = request.StudentId,
                    SubLessonId = request.SubLessonId,
                    SubLessonName = subLesson.Title,
                    ReviewSessionId = filteredContentReady.ReviewSessionId,
                    ReviewSessionData = new ReviewSessionDataResponse
                    {
                        ContentImageOne = filteredContentReady.ContentImageOne,
                        ContentImageTwo = filteredContentReady.ContentImageTwo,
                        ContentImageThree = filteredContentReady.ContentImageThree,
                        ContentText = filteredContentReady.ContentText,
                        CreateDate = filteredContentReady.CreateDate,
                        FailCount = filteredContentReady.FailCount,
                        IsCompleted = filteredContentReady.IsCompleted,
                        IsTestSolved = filteredContentReady.IsTestSolved,
                        ReviewSessionType = filteredContentReady.ReviewSessionType,
                        SummaryImageOne = filteredContentReady.SummaryImageOne,
                        SummaryImageTwo = filteredContentReady.SummaryImageTwo,
                        SummaryText = filteredContentReady.SummaryText,
                        TestJsonData = filteredContentReady.TestJsonData,
                        TestAnswerJsonData = filteredContentReady.TestAnswerJsonData,
                    }
                };
            }

            var lessons = await _lessonService.GetAllLessonAsync();
            var relatedLesson = lessons.FirstOrDefault(x => x.LessonID == subLesson.LessonID);
            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();

            bool englishNeeded = relatedLesson.CourseID is 3 or 14 or 18;

            var systemPromptContent = allPrompts.FirstOrDefault(p =>
                 (int)p.ContentType == 15 &&
                 (englishNeeded ? p.PromptText.StartsWith("[ENG]")
                                : p.PromptText.StartsWith("[TR]")));

            var systemPromptSummary = allPrompts.FirstOrDefault(p =>
                    (int)p.ContentType == 14 &&
                    (englishNeeded ? p.PromptText.StartsWith("[ENG]")
                                   : p.PromptText.StartsWith("[TR]")));

            if (systemPromptContent == null || systemPromptSummary == null)
                throw new Exception($"ContentType 15/14 için {(englishNeeded ? "[ENG]" : "[TR]")} prompt bulunamadı.");

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
                studentAge--;

            var promptTextContent = systemPromptContent.PromptText
                .Replace("[ENG]", string.Empty)
                .Replace("[TR]", string.Empty)
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", relatedLesson.Title)
                .Replace("[TOPIC]", subLesson.Title)
                .Replace("[LEARNING_OBJECTIVES]", subLesson.LessonObjective);

            var promptTextSummary = systemPromptSummary.PromptText
                .Replace("[ENG]", string.Empty)
                .Replace("[TR]", string.Empty)
                .Replace("[STUDENT_AGE]", studentAge.ToString())
                .Replace("[LEARNING_STYLE]", student.LearningStyleType.ToString())
                .Replace("[SUBJECT_NAME]", relatedLesson.Title)
                .Replace("[TOPIC]", subLesson.Title)
                .Replace("[LEARNING_OBJECTIVES]", subLesson.LessonObjective);

            // 1. Content part
            var messagesContent = new List<ChatGptMessage> {
                new ChatGptMessage { role = "system", content = promptTextContent }
            };

            var requestBodyContent = new
            {
                model = "gpt-4o-mini",
                messages = messagesContent,
                temperature = 0.7,
                max_tokens = 2000
            };

            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

            var contentResponse = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(requestBodyContent), Encoding.UTF8, "application/json"));

            if (!contentResponse.IsSuccessStatusCode)
                throw new Exception("OpenAI içerik yanıtı başarısız: " + await contentResponse.Content.ReadAsStringAsync());

            var resultContentJson = await contentResponse.Content.ReadAsStringAsync();
            var parsedContent = JsonSerializer.Deserialize<JsonElement>(resultContentJson);
            var resultContent = parsedContent.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            if (resultContent.StartsWith("```json"))
            {
                resultContent = resultContent.Substring(7);
            }
            else if (resultContent.StartsWith("```"))
            {
                resultContent = resultContent.Substring(3);
            }

            if (resultContent.EndsWith("```"))
            {
                resultContent = resultContent.Substring(0, resultContent.Length - 3);
            }

            Dictionary<int, JsonElement> contentMap = new();
            string generatedTextContent;
            try
            {
                var contentJson = JsonSerializer.Deserialize<JsonElement>(resultContent);
                generatedTextContent = contentJson.GetProperty("content").GetProperty("contentText").GetString();
                contentMap[0] = contentJson;
            }
            catch
            {
                generatedTextContent = resultContent;
                contentMap[0] = parsedContent;
            }

            // 2. Summary part
            var messagesSummary = new List<ChatGptMessage> {
                new ChatGptMessage { role = "system", content = promptTextSummary }
            };

            var requestBodySummary = new
            {
                model = "gpt-4o-mini",
                messages = messagesSummary,
                temperature = 0.7,
                max_tokens = 2000
            };

            var summaryResponse = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions",
                new StringContent(JsonSerializer.Serialize(requestBodySummary), Encoding.UTF8, "application/json"));

            if (!summaryResponse.IsSuccessStatusCode)
                throw new Exception("OpenAI özet yanıtı başarısız: " + await summaryResponse.Content.ReadAsStringAsync());

            var resultSummaryJson = await summaryResponse.Content.ReadAsStringAsync();
            var parsedSummary = JsonSerializer.Deserialize<JsonElement>(resultSummaryJson);
            var resultSummary = parsedSummary.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            if (resultSummary.StartsWith("```json"))
            {
                resultSummary = resultSummary.Substring(7);
            }
            else if (resultSummary.StartsWith("```"))
            {
                resultSummary = resultContent.Substring(3);
            }

            if (resultSummary.EndsWith("```"))
            {
                resultSummary = resultSummary.Substring(0, resultSummary.Length - 3);
            }

            string generatedTextSummary;
            try
            {
                var summaryJson = JsonSerializer.Deserialize<JsonElement>(resultSummary);
                generatedTextSummary = summaryJson.GetProperty("content").GetProperty("contentText").GetString();
                contentMap[1] = summaryJson;
            }
            catch
            {
                generatedTextSummary = resultSummary;
                contentMap[1] = parsedSummary;
            }

            var newReviewSession = new ReviewSession
            {
                ContentText = filteredContentReady?.ContentText ?? generatedTextContent,
                SummaryText = filteredContentReady?.SummaryText ?? generatedTextSummary,
                ContentImageOne = filteredContentReady?.ContentImageOne,
                ContentImageTwo = filteredContentReady?.ContentImageTwo,
                ContentImageThree = filteredContentReady?.ContentImageThree,
                SummaryImageOne = filteredContentReady?.SummaryImageOne,
                SummaryImageTwo = filteredContentReady?.SummaryImageTwo,
                CreateDate = filteredContentReady?.CreateDate ?? DateTime.Now,
                FailCount = filteredContentReady?.FailCount ?? 0,
                IsCompleted = filteredContentReady?.IsCompleted ?? false,
                IsTestSolved = filteredContentReady?.IsTestSolved ?? false,
                TestJsonData = filteredContentReady?.TestJsonData,
                TestAnswerJsonData = filteredContentReady?.TestAnswerJsonData,
                ReviewSessionType = ReviewSessionTypeEnum.Both,
                StudentId = request.StudentId,
                SubLessonId = request.SubLessonId,
                ReviewSessionId = filteredContentReady?.ReviewSessionId ?? 0
            };

            if (filteredContentReady != null)
            {
                filteredContentReady.ContentText = generatedTextContent;
                filteredContentReady.SummaryText = generatedTextSummary;
                filteredContentReady.ContentImageOne = filteredContentReady.ContentImageOne;
                filteredContentReady.ContentImageTwo = filteredContentReady.ContentImageTwo;
                filteredContentReady.ContentImageThree = filteredContentReady.ContentImageThree;
                filteredContentReady.SummaryImageOne = filteredContentReady.SummaryImageOne;
                filteredContentReady.SummaryImageTwo = filteredContentReady.SummaryImageTwo;
                filteredContentReady.CreateDate = filteredContentReady.CreateDate;
                filteredContentReady.FailCount = filteredContentReady.FailCount;
                filteredContentReady.ReviewSessionType = ReviewSessionTypeEnum.Both;
                filteredContentReady.StudentId = request.StudentId;
                filteredContentReady.SubLessonId = request.SubLessonId;
                filteredContentReady.TestJsonData = null;
                filteredContentReady.TestAnswerJsonData = null;
                filteredContentReady.IsCompleted = false;
                filteredContentReady.IsTestSolved = false;

                await _reviewSessionService.UpdateReviewSessionAsync(filteredContentReady);
            }
            else
            {
                await _reviewSessionService.AddReviewSessionAsync(newReviewSession);
            }

            // Generate content images
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _serviceScopeFactory.CreateScope();
                    var chatGptService = scope.ServiceProvider.GetRequiredService<IChatGptService>();

                    await chatGptService.GenerateImagesForContent(
                        relatedLesson.Title,
                        subLesson.Title,
                        studentAge,
                        generatedTextContent,
                        _environment,
                        filteredReviewSessionReady: filteredContentReady,
                        reviewSession: newReviewSession,
                        isReviewSession: true,
                        contentMap: contentMap);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Görsel üretimi hatası: " + ex.Message);
                }
            });

            return new ReviewSessionResponse
            {
                StudentId = request.StudentId,
                SubLessonId = request.SubLessonId,
                SubLessonName = subLesson.Title,
                ReviewSessionId = newReviewSession.ReviewSessionId,
                ReviewSessionData = new ReviewSessionDataResponse
                {
                    ContentImageOne = null,
                    ContentImageTwo = null,
                    ContentImageThree = null,
                    ContentText = newReviewSession.ContentText,
                    CreateDate = newReviewSession.CreateDate,
                    FailCount = newReviewSession.FailCount,
                    IsCompleted = newReviewSession.IsCompleted,
                    IsTestSolved = newReviewSession.IsTestSolved,
                    ReviewSessionType = newReviewSession.ReviewSessionType,
                    SummaryImageOne = null,
                    SummaryImageTwo = null,
                    SummaryText = newReviewSession.SummaryText,
                    TestJsonData = newReviewSession.TestJsonData,
                    TestAnswerJsonData = newReviewSession.TestAnswerJsonData,
                }
            };
        }

        public async Task<ReviewSessionResponse> GetReviewSessionImageStatus(int reviewSessionId)
        {
            var rs = await _reviewSessionService.GetReviewSessionByIdAsync(reviewSessionId);
            if (rs == null)
            {
                throw new Exception("İçerik bulunamadı.");
            }

            var sublesson = await _subLessonService.GetSubLessonByIdAsync(rs.SubLessonId);

            return new ReviewSessionResponse
            {
                ReviewSessionId = rs.ReviewSessionId,
                StudentId = rs.StudentId,
                SubLessonId = rs.SubLessonId,
                SubLessonName = sublesson.Title ?? "Unknown",
                ReviewSessionData = new ReviewSessionDataResponse
                {
                    FailCount = rs.FailCount,
                    ReviewSessionType = rs.ReviewSessionType,
                    IsTestSolved = rs.IsTestSolved,
                    IsCompleted = rs.IsCompleted,
                    TestJsonData = rs.TestJsonData,
                    TestAnswerJsonData = rs.TestAnswerJsonData,
                    ContentText = rs.ContentText,
                    SummaryText = rs.SummaryText,
                    ContentImageOne = rs.ContentImageOne,
                    ContentImageTwo = rs.ContentImageTwo,
                    ContentImageThree = rs.ContentImageThree,
                    SummaryImageOne = rs.SummaryImageOne,
                    SummaryImageTwo = rs.SummaryImageTwo,
                    CreateDate = rs.CreateDate,
                }
            };
        }
    }
}