using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Metalink.Domain.Interfaces;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Enums;
using MetaLink.Domain.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;

namespace MetaLink.Persistence.Services
{
    public class ChatGptService : IChatGptService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly IAiPromptService _aiPromptService;
        private readonly ICourseRepository _courseRepository;
        private readonly ILessonRepository _lessonRepository;
        private readonly ISubLessonRepository _subLessonRepository;
        private readonly IChatContextService _chatContextService;
        private readonly IEmailService _emailService;
        private readonly IStudentService _studentService;
        private readonly IUserService _userService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IAIGeneratedContentService _aigeneratedContentService;
        private readonly IWebHostEnvironment _environment;
        private readonly IReviewSessionService _reviewSessionService;

        public ChatGptService(IConfiguration config, HttpClient httpClient, IConfiguration configuration, IAiPromptService aiPromptService, ICourseRepository courseRepository, ILessonRepository lessonRepository, ISubLessonRepository subLessonRepository, IChatContextService chatContextService, IEmailService emailService, IStudentService studentService, IUserService userService, IServiceScopeFactory scopeFactory, IAIGeneratedContentService aigeneratedContentService, IWebHostEnvironment environment, IReviewSessionService reviewSessionService)
        {
            _environment = environment;
            _config = config;
            _httpClient = httpClient;
            _apiKey = configuration["OpenAI:ApiKey"];
            _aiPromptService = aiPromptService;
            _courseRepository = courseRepository;
            _lessonRepository = lessonRepository;
            _subLessonRepository = subLessonRepository;
            _chatContextService = chatContextService;
            _emailService = emailService;
            _studentService = studentService;
            _userService = userService;
            _scopeFactory = scopeFactory;
            _aigeneratedContentService = aigeneratedContentService;
            _reviewSessionService = reviewSessionService;
        }

        public async Task<List<StoryCardResponse>> GenerateStoryAsync(int studentId, int cardCount)
        {
            string prompt = $@"Çocuklar için uygun, basit ve sıralı bir hikaye oluştur. Hikaye {cardCount} cümleden oluşmalı. Her cümle bir olay veya adımı temsil etmeli ve hikaye mantıklı bir akışa sahip olmalı. Çıktıyı JSON formatında döndür, her cümle için bir nesne olsun ve her nesne şu alanları içersin: id (1'den başlayarak artan), text (cümle), order (sıra numarası, 1'den başlayarak). Örnek format:
            [
                {{ ""id"": 1, ""text"": ""Ali parka gitti."", ""order"": 1 }},
                {{ ""id"": 2, ""text"": ""Top oynadı."", ""order"": 2 }},
                {{ ""id"": 3, ""text"": ""Eve döndü."", ""order"": 3 }}
            ]
            Hikaye, {cardCount} kart için uygun uzunlukta ve çocuklar için eğlenceli olmalı. Türkçe cümleler kullan.";

            var messages = new List<ChatGptMessage>
            {
                new ChatGptMessage { role = "system", content = "Sen bir hikaye oluşturma asistanısın. Çocuklar için uygun, basit ve sıralı hikayeler üretiyorsun." },
                new ChatGptMessage { role = "user", content = prompt }
            };

            var result = await SendAiRequestAsync(messages, maxTokens: 1000);

            try
            {
                var storyCards = System.Text.Json.JsonSerializer.Deserialize<List<StoryCardResponse>>(result, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                return storyCards;
            }
            catch (System.Text.Json.JsonException ex)
            {
                throw new InvalidOperationException($"Hikaye JSON parse hatası: {ex.Message}");
            }
        }

        public async Task<List<QuizQuestionGameResponse>> GenerateQuizQuestionsAsync(string topic)
        {
            string prompt = $@"Çocuklar için uygun, '{topic}' konulu 5 adet çoktan seçmeli soru oluştur. Her soru 4 şık içermeli ve sadece biri doğru olmalı. Sorular Türkçe olmalı ve basit, anlaşılır bir dil kullanmalı. Çıktıyı JSON formatında döndür, her soru için bir nesne olsun ve her nesne şu alanları içersin: 
            - text (soru metni), 
            - answers (4 şıktan oluşan dizi), 
            - correctAnswer (doğru cevabın indeksi, 0-3 arası). 
            Örnek format:
            [
                {{
                    ""text"": ""Dünyanın en büyük okyanusu hangisidir?"",
                    ""answers"": [""Atlantik"", ""Hint"", ""Arktik"", ""Pasifik""],
                    ""correctAnswer"": 3
                }},
                {{
                    ""text"": ""Türkiye'nin başkenti neresidir?"",
                    ""answers"": [""İstanbul"", ""Ankara"", ""İzmir"", ""Bursa""],
                    ""correctAnswer"": 1
                }}
            ]
            Sorular, '{topic}' konusuna uygun olmalı ve çocuklar için eğitici, eğlenceli olmalı.";

            var messages = new List<ChatGptMessage>
            {
                new ChatGptMessage { role = "system", content = "Sen bir quiz sorusu oluşturma asistanısın. Çocuklar için uygun, eğitici ve eğlenceli çoktan seçmeli sorular üretiyorsun." },
                new ChatGptMessage { role = "user", content = prompt }
            };

            var result = await SendAiRequestAsync(messages, maxTokens: 1500);

            try
            {
                var quizQuestions = System.Text.Json.JsonSerializer.Deserialize<List<QuizQuestionGameResponse>>(result, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                return quizQuestions;
            }
            catch (System.Text.Json.JsonException ex)
            {
                throw new InvalidOperationException($"Quiz soruları JSON parse hatası: {ex.Message}");
            }
        }

        public async Task<ChatGptResponse> AvatarChatMessageAsync(UserMessage message)
        {
            var student = await _studentService.GetByIdAsync(message.StudentId);
            if (student == null) throw new ArgumentException(nameof(student), "Student not found!");
            var parent = await _userService.GetByIdAsync(student.UserID);
            if (parent == null) throw new ArgumentException(nameof(parent), "Parent not found!");

            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 9);

            if (systemPrompt == null)
            {
                throw new Exception("ContentType 9 olan prompt bulunamadı.");
            }

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            var studentName = student.FirstName + " " + student.LastName;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
            {
                studentAge--;
            }

            var newSystemPrompt = systemPrompt.PromptText
                .Replace("[STUDENT_FULLNAME]", studentName.ToString())
                .Replace("[STUDENT_AGE]", studentAge.ToString());

            var messages = await _chatContextService.BuildMessageContextAsync(
                message.StudentId,
                "AvatarAssistantRobot",
                newSystemPrompt,
                message.message
            );

            var result = await SendAiRequestAsync(messages, maxTokens: 1000);

            await _chatContextService.SaveNewMessagePairAsync(
                message.StudentId,
                "AvatarAssistantRobot",
                message.message,
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

            _ = Task.Run(() => AnalyzeMessageContentAsync(message.message, newAnalizeMessageContentRequest));

            if (message.VoiceEnable)
            {
                var audioData = await SynthesizeSpeechAsync(result, student.VoiceType.Value);

                return new ChatGptResponse
                {
                    response = result,
                    audio = audioData
                };
            }

            return new ChatGptResponse
            {
                response = result
            };
        }

        public async Task<ChatGptResponse> AskQuestionAssistantRobot(UserMessage message)
        {
            var student = await _studentService.GetByIdAsync(message.StudentId);
            if (student == null) throw new ArgumentException(nameof(student), "Student not found!");
            var parent = await _userService.GetByIdAsync(student.UserID);
            if (parent == null) throw new ArgumentException(nameof(parent), "Parent not found!");

            var allPrompts = await _aiPromptService.GetAllAiPromptAsync();
            var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 4);

            if (systemPrompt == null)
            {
                throw new Exception("ContentType 4 olan prompt bulunamadı.");
            }

            var today = DateTime.Today;
            var studentAge = today.Year - student.DateOfBirth.Year;
            var studentName = student.FirstName + " " + student.LastName;
            if (student.DateOfBirth.Date > today.AddYears(-studentAge))
            {
                studentAge--;
            }

            var newSystemPrompt = systemPrompt.PromptText
                .Replace("[STUDENT_FULLNAME]", studentName.ToString())
                .Replace("[STUDENT_AGE]", studentAge.ToString());

            var courses = await _courseRepository.GetAllAsync();
            var lessons = await _lessonRepository.GetAllAsync();
            var subLessons = await _subLessonRepository.GetAllAsync();

            var response = new CourseLessonSubLessonManagementResponse
            {
                Courses = courses.Select(course => new CourseResponse
                {
                    CourseID = course.CourseID,
                    Name = course.Name,
                    ClassLevel = course.ClassLevel,
                    Lessons = lessons
                        .Where(l => l.CourseID == course.CourseID)
                        .Select(lesson => new LessonsResponse
                        {
                            Id = lesson.LessonID,
                            CourseId = lesson.CourseID,
                            Title = lesson.Title,
                            SubLessons = subLessons
                                .Where(s => s.LessonID == lesson.LessonID)
                                .Select(sub => new SubLessonsResponse
                                {
                                    SubLessonID = sub.SubLessonID,
                                    LessonID = sub.LessonID,
                                    Title = sub.Title,
                                    LessonObjective = sub.LessonObjective ?? "",
                                }).ToList()
                        }).ToList()
                }).ToList()
            };

            var sb = new StringBuilder();

            foreach (var course in response.Courses)
            {
                sb.AppendLine($"CourseID: {course.CourseID}");
                sb.AppendLine($"Name: {course.Name}");
                sb.AppendLine($"ClassLevel: {course.ClassLevel}");

                foreach (var lesson in course.Lessons)
                {
                    sb.AppendLine($"\tLessonID: {lesson.Id}");
                    sb.AppendLine($"\tTitle: {lesson.Title}");

                    foreach (var subLesson in lesson.SubLessons)
                    {
                        sb.AppendLine($"\t\tSubLessonID: {subLesson.SubLessonID}");
                        sb.AppendLine($"\t\tTitle: {subLesson.Title}");
                        sb.AppendLine($"\t\tLessonObjective: {subLesson.LessonObjective}");
                    }
                }
            }

            var fullContentText = $"{newSystemPrompt}\nStudentId: " + student.StudentID + "\nMevcut Dersler:\n" + sb.ToString();

            var messages = await _chatContextService.BuildMessageContextAsync(
                message.StudentId,
                "AssistantRobot",
                fullContentText,
                message.message
            );

            var result = await SendAiRequestAsync(messages, maxTokens: 500);

            await _chatContextService.SaveNewMessagePairAsync(
                message.StudentId,
                "AssistantRobot",
                message.message,
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

            _ = Task.Run(() => AnalyzeMessageContentAsync(message.message, newAnalizeMessageContentRequest));

            return new ChatGptResponse { response = result };
        }

        public async Task<string> SendAiRequestAsync(List<ChatGptMessage> messages, string model = "gpt-4o-mini", double temperature = 0.7, int maxTokens = 2000)
        {
            var requestBody = new
            {
                model,
                messages,
                temperature,
                max_tokens = maxTokens
            };

            var jsonRequest = System.Text.Json.JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

            var responseAPI = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
            if (!responseAPI.IsSuccessStatusCode)
            {
                var errorResponse = await responseAPI.Content.ReadAsStringAsync();
                throw new InvalidOperationException($"OpenAI API hatası: {errorResponse}");
            }

            var jsonResponse = await responseAPI.Content.ReadAsStringAsync();
            var parsedResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(jsonResponse);
            var result = parsedResponse.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

            if (result.StartsWith("```json"))
            {
                result = result.Substring(7).Trim();
                if (result.EndsWith("```"))
                {
                    result = result.Substring(0, result.Length - 3).Trim();
                }
            }

            return result;
        }

        public async Task AnalyzeMessageContentAsync(string message, AnalizeMessageContentRequest analizeMessageContentRequest)
        {
            using (var scope = _scopeFactory.CreateScope())
            {
                var aiPromptService = scope.ServiceProvider.GetRequiredService<IAiPromptService>();
                var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                var allPrompts = await aiPromptService.GetAllAiPromptAsync();
                var systemPrompt = allPrompts.FirstOrDefault(p => (int)p.ContentType == 10);
                if (systemPrompt == null)
                    throw new Exception("ContentType 10 olan prompt bulunamadı.");

                var request = new
                {
                    model = "gpt-4o-mini",
                    messages = new[]
                    {
                        new { role = "system", content = systemPrompt.PromptText },
                        new { role = "user", content = message }
                    },
                    temperature = 0.2,
                    max_tokens = 3000,
                };

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                var requestContent = new StringContent(System.Text.Json.JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", requestContent);
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var parsedResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(jsonResponse);
                var result = parsedResponse.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();

                string jsonText = result;
                if (jsonText.Contains("```json"))
                {
                    var start = jsonText.IndexOf("```json") + 7;
                    var end = jsonText.LastIndexOf("```");
                    jsonText = jsonText.Substring(start, end - start).Trim();
                }

                MessageContentAnalysisResponse? analysis = null;
                try
                {
                    analysis = System.Text.Json.JsonSerializer.Deserialize<MessageContentAnalysisResponse>(jsonText, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                    Console.WriteLine("---- Message Analysis Result ----");
                    Console.WriteLine("Negativity: " + analysis.HasNegativeContent);
                    Console.WriteLine("Risk Score: " + analysis.RiskScore);
                    Console.WriteLine("Category  : " + analysis.Category);
                    Console.WriteLine("----------------------------------");
                }
                catch
                {
                    return;
                }

                if (analysis == null || analysis.RiskScore < 50)
                {
                    Console.WriteLine("---- Message Analysis Result ----");
                    Console.WriteLine("Negativity: " + analysis.HasNegativeContent);
                    Console.WriteLine("Risk Score: " + analysis.RiskScore);
                    Console.WriteLine("Category  : " + analysis.Category);
                    Console.WriteLine("----------------------------------");
                    return;
                }

                var htmlContent = new StringBuilder();
                htmlContent.AppendLine("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px; border-radius: 10px;\">");
                htmlContent.AppendLine("<h2 style=\"color: #c0392b;\">📢 Riskli İçerik Uyarısı</h2>");
                htmlContent.AppendLine($"<p style=\"color: #333;\">Sayın {analizeMessageContentRequest.ParentName} {analizeMessageContentRequest.ParentLastName},</p>");
                htmlContent.AppendLine($"<p style=\"color: #555;\">Çocuğunuz <strong>{analizeMessageContentRequest.StudentName} {analizeMessageContentRequest.StudentLastName}</strong> tarafından yazılan bir mesaj, sistemimiz tarafından analiz edilmiştir.</p>");
                htmlContent.AppendLine("<h3 style=\"color: #2c3e50;\">📩 Mesaj İçeriği</h3>");
                htmlContent.AppendLine($"<blockquote style=\"color: #555; background-color: #fff; padding: 10px; border-left: 5px solid #e74c3c;\">{message}</blockquote>");
                htmlContent.AppendLine("<h3 style=\"color: #2c3e50;\">📊 Analiz Sonuçları</h3>");
                htmlContent.AppendLine("<ul style=\"color: #555;\">");
                htmlContent.AppendLine($"<li><strong>Olumsuz İçerik:</strong> {(analysis.HasNegativeContent ? "Evet" : "Hayır")}</li>");
                htmlContent.AppendLine($"<li><strong>Kategori:</strong> {analysis.Category}</li>");
                htmlContent.AppendLine($"<li><strong>Risk Puanı:</strong> {analysis.RiskScore} / 100</li>");
                htmlContent.AppendLine("</ul>");
                htmlContent.AppendLine("<p style=\"color: #555;\">Bu mesaj, çocuğunuzun duygusal durumu veya çevresi hakkında bilgi verebilir. Gerekli gördüğünüz takdirde rehberlik birimimizle iletişime geçebilirsiniz.</p>");
                htmlContent.AppendLine("<p style=\"color: #777; font-size: 13px;\">Not: Bu mesaj otomatik analiz sistemimiz tarafından üretilmiştir.</p>");
                htmlContent.AppendLine("</div>");

                var emailMessage = new
                {
                    Messages = new[]
                    {
                        new
                        {
                            From = new { Email = _config["Mailjet:Email"], Name = "MetaLink" },
                            To = new[] { new { Email = analizeMessageContentRequest.ParentMail, Name = analizeMessageContentRequest.ParentName + " " + analizeMessageContentRequest.ParentLastName } },
                            Subject = "📢 Riskli İçerik Tespiti: Öğrenci Mesajı Raporu",
                            HTMLPart = htmlContent.ToString()
                        }
                    }
                };

                var messageJson = JsonConvert.SerializeObject(emailMessage);
                await emailService.SendMessageEmailAsync(messageJson);
            }
        }

        public async Task<ChatGptResponse> HandleAudioAvatarChatAsync(IFormFile audio, int studentId)
        {
            using var memoryStream = new MemoryStream();
            await audio.CopyToAsync(memoryStream);
            var audioData = memoryStream.ToArray();

            var transcribedText = await TranscribeSpeechAsync(audioData);

            var message = new UserMessage
            {
                StudentId = studentId,
                message = transcribedText,
                VoiceEnable = true,
            };

            var response = await AvatarChatMessageAsync(message);

            response.requestMessage = transcribedText;

            return response;
        }

        // (Speech-to-Text)
        private async Task<string> TranscribeSpeechAsync(byte[] audioData)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/audio/transcriptions")
                {
                    Content = new MultipartFormDataContent
                    {
                        { new ByteArrayContent(audioData), "file", "audio.wav" },
                        { new StringContent("whisper-1"), "model" }
                    }
                };
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonResponse = await response.Content.ReadAsStringAsync();
                var result = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(jsonResponse).GetProperty("text").GetString();
                return result ?? string.Empty;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ses transkripsiyon hatası: {ex.Message}");
                return string.Empty;
            }
        }

        // (Text-to-Speech)
        public async Task<byte[]> SynthesizeSpeechAsync(string text, VoiceTypeEnum voiceTypeEnum)
        {
            try
            {
                var voiceName = voiceTypeEnum.ToString().ToLower();

                var requestBody = new
                {
                    model = "gpt-4o-mini-tts",
                    input = text,
                    voice = voiceName
                };

                var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

                var response = await _httpClient.PostAsync("https://api.openai.com/v1/audio/speech", content);

                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsByteArrayAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ses sentezi hatası: {ex.Message}");
                return null;
            }
        }

        // Image Generator
        public async Task GenerateImagesForContent(
            string lessonTitle,
            string subLessonTitle,
            int studentAge,
            string jsonContent,
            IWebHostEnvironment environment,
            AIGeneratedContent aIGeneratedContent = null,
            AIGeneratedContent filteredContentReady = null,
            bool isReviewSession = false,
            ReviewSession reviewSession = null,
            ReviewSession filteredReviewSessionReady = null,
            Dictionary<int, JsonElement> contentMap = null)
        {
            var contentImagesPath = Path.Combine(environment.WebRootPath, "contentimages");

            if (!Directory.Exists(contentImagesPath))
                Directory.CreateDirectory(contentImagesPath);

            try
            {
                if (filteredContentReady != null || filteredReviewSessionReady != null)
                {
                    List<string?> oldImageUrls;
                    if (isReviewSession)
                    {
                        oldImageUrls = new[]
                        {
                            filteredReviewSessionReady.ContentImageOne,
                            filteredReviewSessionReady.ContentImageTwo,
                            filteredReviewSessionReady.ContentImageThree,
                            filteredReviewSessionReady.SummaryImageOne,
                            filteredReviewSessionReady.SummaryImageTwo
                        }
                        .Where(x => !string.IsNullOrEmpty(x))
                        .ToList();
                    }
                    else
                    {
                        oldImageUrls = new[]
                        {
                            filteredContentReady.GeneratedImage1,
                            filteredContentReady.GeneratedImage2,
                            filteredContentReady.GeneratedImage3
                        }
                        .Where(x => !string.IsNullOrEmpty(x))
                        .ToList();
                    }

                    foreach (var imageUrl in oldImageUrls)
                    {
                        try
                        {
                            var fileName = Path.GetFileName(imageUrl);
                            var filePath = Path.Combine(contentImagesPath, fileName);
                            if (File.Exists(filePath))
                                File.Delete(filePath);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Eski görsel silme hatası: {ex.Message}");
                        }
                    }

                    if (isReviewSession)
                    {
                        filteredReviewSessionReady.ContentImageOne = null;
                        filteredReviewSessionReady.ContentImageTwo = null;
                        filteredReviewSessionReady.ContentImageThree = null;
                        filteredReviewSessionReady.SummaryImageOne = null;
                        filteredReviewSessionReady.SummaryImageTwo = null;
                        await _reviewSessionService.UpdateReviewSessionAsync(filteredReviewSessionReady);
                    }
                    else
                    {
                        filteredContentReady.GeneratedImage1 = null;
                        filteredContentReady.GeneratedImage2 = null;
                        filteredContentReady.GeneratedImage3 = null;
                        await _aigeneratedContentService.UpdateAIGeneratedContentAsync(filteredContentReady);
                    }
                }

                JsonElement imagesArray;
                Dictionary<int, string> imageIndexMap = new();
                int totalImageCount = 0;

                if (isReviewSession && !contentMap.IsNullOrEmpty())
                {
                    var parsedContent = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contentMap[0]);
                    var imagesArray1 = parsedContent.GetProperty("content").GetProperty("images");
                    int length1 = imagesArray1.GetArrayLength();

                    var parsedSummary = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(contentMap[1]);
                    var imagesArray2 = parsedSummary.GetProperty("content").GetProperty("images");
                    int length2 = imagesArray2.GetArrayLength();

                    // Sıralama için index -> hedef alan adı
                    for (int i = 0; i < length1; i++)
                        imageIndexMap[totalImageCount++] = $"ContentImage{i + 1}";
                    for (int i = 0; i < length2; i++)
                        imageIndexMap[totalImageCount++] = $"SummaryImage{i + 1}";

                    var combinedList = imagesArray1.EnumerateArray().ToList();
                    combinedList.AddRange(imagesArray2.EnumerateArray());
                    var combinedJson = System.Text.Json.JsonSerializer.Serialize(combinedList);
                    imagesArray = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(combinedJson);
                }
                else
                {
                    var parsedContent = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(jsonContent);
                    imagesArray = parsedContent.GetProperty("content").GetProperty("images");
                    for (int i = 0; i < imagesArray.GetArrayLength(); i++)
                        imageIndexMap[i] = $"GeneratedImage{i + 1}";
                }

                var results = new string[imagesArray.GetArrayLength()];

                await Parallel.ForEachAsync(imagesArray.EnumerateArray().Select((element, index) => (element, index)),
                    new ParallelOptions { MaxDegreeOfParallelism = imageIndexMap.Count },
                    async (tuple, _) =>
                    {
                        var (imageElement, imageIndex) = tuple;

                        var imageDescription = imageElement.GetProperty("imageDescription").GetString();
                        var imagePrompt = $"{imageDescription} (Optimized for {studentAge}-year-old student, related to {lessonTitle} - {subLessonTitle})";

                        var requestBody = new
                        {
                            model = "dall-e-3",
                            prompt = imagePrompt,
                            n = 1,
                            size = "1024x1024",
                            quality = "standard",
                            response_format = "b64_json"
                        };

                        var json = System.Text.Json.JsonSerializer.Serialize(requestBody);
                        var content = new StringContent(json, Encoding.UTF8, "application/json");

                        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

                        var response = await _httpClient.PostAsync("https://api.openai.com/v1/images/generations", content);
                        if (!response.IsSuccessStatusCode)
                        {
                            Console.WriteLine($"DALL-E API hatası: {await response.Content.ReadAsStringAsync()}");
                            return;
                        }

                        var responseContent = await response.Content.ReadAsStringAsync();
                        var imageResponse = System.Text.Json.JsonSerializer.Deserialize<JsonElement>(responseContent);
                        var base64 = imageResponse.GetProperty("data")[0].GetProperty("b64_json").GetString();
                        byte[] bytes = Convert.FromBase64String(base64);

                        var fileName = $"{Guid.NewGuid()}.png";
                        var filePath = Path.Combine(contentImagesPath, fileName);
                        await File.WriteAllBytesAsync(filePath, bytes);
                        var imageUrl = $"/contentimages/{fileName}";

                        results[imageIndex] = imageUrl;
                    });

                if (isReviewSession)
                {
                    foreach (var kvp in imageIndexMap)
                    {
                        string imageUrl = results.ElementAtOrDefault(kvp.Key);
                        if (string.IsNullOrEmpty(imageUrl)) continue;

                        switch (kvp.Value)
                        {
                            case "ContentImage1": filteredReviewSessionReady.ContentImageOne = imageUrl; break;
                            case "ContentImage2": filteredReviewSessionReady.ContentImageTwo = imageUrl; break;
                            case "ContentImage3": filteredReviewSessionReady.ContentImageThree = imageUrl; break;
                            case "SummaryImage1": filteredReviewSessionReady.SummaryImageOne = imageUrl; break;
                            case "SummaryImage2": filteredReviewSessionReady.SummaryImageTwo = imageUrl; break;
                        }
                    }

                    await _reviewSessionService.UpdateReviewSessionAsync(filteredReviewSessionReady);
                }
                else
                {
                    foreach (var kvp in imageIndexMap)
                    {
                        string imageUrl = results.ElementAtOrDefault(kvp.Key);
                        if (string.IsNullOrEmpty(imageUrl)) continue;

                        switch (kvp.Value)
                        {
                            case "GeneratedImage1": aIGeneratedContent.GeneratedImage1 = imageUrl; break;
                            case "GeneratedImage2": aIGeneratedContent.GeneratedImage2 = imageUrl; break;
                            case "GeneratedImage3": aIGeneratedContent.GeneratedImage3 = imageUrl; break;
                        }
                    }

                    await _aigeneratedContentService.UpdateAIGeneratedContentAsync(aIGeneratedContent);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Genel hata: {ex.Message}");
            }
        }
    }
}