using System.Text;
using AutoMapper;
using Metalink.Domain.Enums;
using Metalink.Domain.Interfaces;
using MetaLink.Application.DTOs;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;

namespace MetaLink.Application.Services
{
    public class LearningStyleAppService : ILearningStyleAppService
    {
        private readonly IConfiguration _config;
        private readonly IMapper _mapper;
        private readonly ILearningStyleCategoryService _learningStyleCategoryService;
        private readonly ILearningStyleQuestionService _learningStyleQuestionService;
        private readonly ILearningStyleAnswerService _learningStyleAnswerService;
        private readonly IStudentService _studentService;
        private readonly IEmailService _emailService;
        private readonly IUserService _userService;

        public LearningStyleAppService(IConfiguration config, IMapper mapper, ILearningStyleCategoryService learningStyleCategoryService, ILearningStyleQuestionService learningStyleQuestionService, ILearningStyleAnswerService learningStyleAnswerService, IStudentService studentService, IEmailService emailService, IUserService userService)
        {
            _config = config;
            _mapper = mapper;
            _learningStyleCategoryService = learningStyleCategoryService;
            _learningStyleQuestionService = learningStyleQuestionService;
            _learningStyleAnswerService = learningStyleAnswerService;
            _studentService = studentService;
            _emailService = emailService;
            _userService = userService;
        }

        #region Learning Style User Operations
        public async Task<LearningStyleResponse> GetLearningStylesQuestions(int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if(student == null) throw new ArgumentException("Student not found!", nameof(student));

            if (student.LearningStyleCompleated)
            {
                return new LearningStyleResponse
                {
                    LearningStyleCompleated = true,
                    LearningStyleCategories = null,
                };
            }

            var learningStyleCategories = await _learningStyleCategoryService.GetAllAsync();
            var learningStyleQuestions = await _learningStyleQuestionService.GetAllAsync();

            var response = new LearningStyleResponse
            {
                LearningStyleCompleated = false,
                LearningStyleCategories = learningStyleCategories.Select(category => new LearningStyleCategoryResponse
                {
                    ID = category.ID,
                    CategoryName = category.CategoryName,
                    LearningStyleQuestions = learningStyleQuestions
                        .Where(question => question.LearningStyleCategoryID == category.ID)
                        .Select(question => new LearningStyleQuestionResponse
                        {
                            ID = question.ID,
                            LearningStyleCategoryID = question.LearningStyleCategoryID,
                            QuestionText = question.QuestionText
                        }).ToList()
                }).ToList()
            };

            return response;
        }

        public async Task<bool> PostLearningStylesAnswer(LearningStyleRequest learningStyleRequest, int studentId)
        {
            var student = await _studentService.GetByIdAsync(studentId);
            if (student == null) throw new ArgumentException(nameof(student), "Student not found!");

            if (student.LearningStyleCompleated)
            {
                return false;
            }

            var categoryTrueCount = new Dictionary<int, int>();

            foreach (var category in learningStyleRequest.LearningStyleCategories)
            {
                foreach (var question in category.LearningStyleQuestions)
                {
                    var newLearningStyleAnswer = new LearningStyleAnswerDTO
                    {
                        Answer = question.Answer,
                        LearningStyleQuestionID = question.ID,
                        StudentID = studentId
                    };

                    await _learningStyleAnswerService.AddAsync(_mapper.Map<LearningStyleAnswer>(newLearningStyleAnswer));

                    if (question.Answer.HasValue && question.Answer.Value)
                    {
                        if (!categoryTrueCount.ContainsKey(category.ID))
                        {
                            categoryTrueCount[category.ID] = 0;
                        }
                        categoryTrueCount[category.ID]++;
                    }
                }
            }

            var maxTrueCategory = categoryTrueCount.OrderByDescending(x => x.Value).FirstOrDefault();
            int mostTrueCategoryId = maxTrueCategory.Key;

            if (Enum.IsDefined(typeof(LearningStyleEnum), mostTrueCategoryId))
            {
                student.LearningStyleType = (LearningStyleEnum)mostTrueCategoryId;
            }

            student.LearningStyleCompleated = true;
            await _studentService.UpdateStudentAsync(student);

            var parent = await _userService.GetByIdAsync(student.UserID);
            if (parent == null) throw new ArgumentException(nameof(parent), "Parent not found!");

            var htmlContent = new StringBuilder();
            htmlContent.AppendLine("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
            htmlContent.AppendLine("<h3 style=\"color: #333;\">Öğrenme Stili Değerlendirme Sonuçları</h3>");
            htmlContent.AppendLine("<p style=\"color: #555;\">Sayın veli,</p>");
            htmlContent.AppendLine($"<p style=\"color: #555;\">Çocuğunuz, {student.FirstName + student.LastName}, öğrenme stili değerlendirmesini tamamladı. Aşağıda sonuçlar yer almaktadır:</p>");
            htmlContent.AppendLine("<h4 style=\"color: #333;\">Sorular ve Cevaplar:</h4>");

            foreach (var category in learningStyleRequest.LearningStyleCategories)
            {
                htmlContent.AppendLine($"<h5 style=\"color: #444;\">{category.CategoryName}</h5>");
                htmlContent.AppendLine("<ul style=\"color: #555;\">");
                foreach (var question in category.LearningStyleQuestions)
                {
                    var questionText = question.QuestionText;
                    var answer = question.Answer.HasValue ? (question.Answer.Value ? "Evet" : "Hayır") : "Cevaplanmadı";
                    htmlContent.AppendLine($"<li>{questionText} - Cevap: {answer}</li>");
                }
                htmlContent.AppendLine("</ul>");
            }

            htmlContent.AppendLine($"<p style=\"color: #555;\">Bu cevaplara dayanarak, belirlenen öğrenme stili: {student.LearningStyleType.ToString()}</p>");
            htmlContent.AppendLine("<p style=\"color: #555;\">Teşekkür ederiz!</p>");
            htmlContent.AppendLine("</div>");

            var emailMessage = new
            {
                Messages = new[]
                {
                    new
                    {
                        From = new { Email = _config["Mailjet:Email"], Name = "MetaLink" },
                        To = new[] { new { Email = parent.Email, Name = (parent.FirstName + parent.LastName) } },
                        Subject = "Öğrenme Stili Değerlendirme Sonuçları",
                        HTMLPart = htmlContent.ToString()
                    }
                }
            };

            var messageJson = JsonConvert.SerializeObject(emailMessage);

            await _emailService.SendMessageEmailAsync(messageJson);

            return true;
        }

        #endregion

        #region Learning Style Admin Operations

        public async Task<LearningStyleResponse> GetLearningStylesAsync()
        {
            var learningStyleCategories = await _learningStyleCategoryService.GetAllAsync();
            var learningStyleQuestions = await _learningStyleQuestionService.GetAllAsync();

            var response = new LearningStyleResponse
            {
                LearningStyleCompleated = false,
                LearningStyleCategories = learningStyleCategories.Select(category => new LearningStyleCategoryResponse
                {
                    ID = category.ID,
                    CategoryName = category.CategoryName,
                    LearningStyleQuestions = learningStyleQuestions
                        .Where(question => question.LearningStyleCategoryID == category.ID)
                        .Select(question => new LearningStyleQuestionResponse
                        {
                            ID = question.ID,
                            LearningStyleCategoryID = question.LearningStyleCategoryID,
                            QuestionText = question.QuestionText
                        }).ToList()
                }).ToList()
            };

            return response;
        }

        public async Task<bool> CreateLearningStyleCategoryAsync(LearningStyleCategoryDTO learningStyleCategoryDto)
        {
            var newLearningStyleCategory = new LearningStyleCategory
            {
                CategoryName = learningStyleCategoryDto.CategoryName,
            };

            await _learningStyleCategoryService.AddAsync(newLearningStyleCategory);

            return true;
        }

        public async Task<bool> UpdateLearningStyleCategoryAsync(LearningStyleCategoryDTO learningStyleCategoryDto)
        {
            var category = await _learningStyleCategoryService.GetByIdAsync(learningStyleCategoryDto.ID);
            if (category == null) throw new ArgumentException(nameof(category), "Category not found!");

            category.CategoryName = learningStyleCategoryDto.CategoryName;

            await _learningStyleCategoryService.UpdateAsync(category);

            return true;
        }

        public async Task<bool> DeleteLearningStyleCategoryAsync(int learningStyleCategoryId)
        {
            var category = await _learningStyleCategoryService.GetByIdAsync(learningStyleCategoryId);
            if (category == null) throw new ArgumentException(nameof(category), "Category not found!");

            var lsQuestions = (await _learningStyleQuestionService.GetAllAsync()).Where(ls => ls.LearningStyleCategoryID == learningStyleCategoryId);

            foreach (var question in lsQuestions)
            {
                await _learningStyleQuestionService.DeleteAsync(question.ID);
            }

            var status = await _learningStyleCategoryService.DeleteAsync(learningStyleCategoryId);
            if (!status) return false;
            return true;
        }

        public async Task<bool> CreateLearningStyleQuestionAsync(LearningStyleQuestionDTO learningStyleQuestionDto)
        {
            var newLearningQuestion = new LearningStyleQuestion
            {
                LearningStyleCategoryID = learningStyleQuestionDto.LearningStyleCategoryID,
                QuestionText = learningStyleQuestionDto.QuestionText,
            };

            await _learningStyleQuestionService.AddAsync(newLearningQuestion);

            return true;
        }

        public async Task<bool> UpdateLearningStyleQuestionAsync(LearningStyleQuestionDTO learningStyleQuestionDto)
        {
            var lsQuestion = await _learningStyleQuestionService.GetByIdAsync(learningStyleQuestionDto.ID);
            if (lsQuestion == null) throw new ArgumentNullException(nameof(lsQuestion), "Learning style question not found!");

            await _learningStyleQuestionService.UpdateAsync(lsQuestion);

            return true;
        }

        public async Task<bool> DeleteLearningStyleQuestionAsync(int learningStyleQuestionId)
        {
            var lsQuestion = await _learningStyleQuestionService.GetByIdAsync(learningStyleQuestionId);
            if (lsQuestion == null) throw new ArgumentNullException(nameof(lsQuestion), "Learning style question not found!");

            var status = await _learningStyleQuestionService.DeleteAsync(learningStyleQuestionId);
            if (!status) return false;
            return true;
        }

        #endregion
    }
}
