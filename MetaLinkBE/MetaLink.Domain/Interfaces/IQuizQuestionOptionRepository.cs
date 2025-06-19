using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IQuizQuestionOptionRepository
    {
        Task<QuizQuestionOption> GetQuizQuestionOptionByIdAsync(int optionId);
        Task<IEnumerable<QuizQuestionOption>> GetAllQuizQuestionOptionsAsync();
        Task<QuizQuestionOption> CreateQuizQuestionOptionAsync(QuizQuestionOption quizQuestionOption);
        Task<QuizQuestionOption> UpdateQuizQuestionOptionAsync(QuizQuestionOption quizQuestionOption);
        Task<bool> DeleteQuizQuestionOptionAsync(int optionId);

        Task<IEnumerable<QuizQuestionOption>> GetOptionsByQuestionIdAsync(int questionId);
    }
}
