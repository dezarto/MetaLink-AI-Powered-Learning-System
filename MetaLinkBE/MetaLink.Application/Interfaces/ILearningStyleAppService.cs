using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;

namespace MetaLink.Application.Interfaces
{
    public interface ILearningStyleAppService
    {
        // Learning Style User
        Task<LearningStyleResponse> GetLearningStylesQuestions(int studentId);
        Task<bool> PostLearningStylesAnswer(LearningStyleRequest learningStyleRequest, int studentId);

        // Learning Style Management Admin
        Task<LearningStyleResponse> GetLearningStylesAsync();

        Task<bool> CreateLearningStyleCategoryAsync(LearningStyleCategoryDTO learningStyleCategoryDto);
        Task<bool> UpdateLearningStyleCategoryAsync(LearningStyleCategoryDTO learningStyleCategoryDto);
        Task<bool> DeleteLearningStyleCategoryAsync(int learningStyleCategoryId);

        Task<bool> CreateLearningStyleQuestionAsync(LearningStyleQuestionDTO learningStyleQuestionDto);
        Task<bool> UpdateLearningStyleQuestionAsync(LearningStyleQuestionDTO learningStyleQuestionDto);
        Task<bool> DeleteLearningStyleQuestionAsync(int learningStyleQuestionId);
    }
}
