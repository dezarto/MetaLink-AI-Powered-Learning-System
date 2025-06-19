using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IQuizAnswerService
    {
        Task<QuizAnswer> GetAnswerByStudentAndQuizAsync(int studentId, int quizId);
        Task<IEnumerable<QuizAnswer>> GetAllQuizAnswersAsync();
        Task<QuizAnswer> CreateQuizAnswerAsync(QuizAnswer quizAnswer);
        Task<QuizAnswer> UpdateQuizAnswerAsync(QuizAnswer quizAnswer);
        Task<bool> DeleteQuizAnswerAsync(int quizAnswerId);

        Task SaveChangesAsync();
    }
}
