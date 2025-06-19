using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IQuizQuestionService
    {
        Task<QuizQuestion> GetQuizQuestionByIdAsync(int questionId);
        Task<IEnumerable<QuizQuestion>> GetAllQuizQuestionsAsync();
        Task<QuizQuestion> CreateQuizQuestionAsync(QuizQuestion quizQuestion);
        Task<QuizQuestion> UpdateQuizQuestionAsync(QuizQuestion quizQuestion);
        Task<bool> DeleteQuizQuestionAsync(int questionId);

        Task<IEnumerable<QuizQuestion>> GetQuestionsByQuizIdAsync(int quizId);
    }
}
