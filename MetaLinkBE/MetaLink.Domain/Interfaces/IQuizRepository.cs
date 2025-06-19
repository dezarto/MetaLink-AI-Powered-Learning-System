using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IQuizRepository
    {
        Task<Quiz> GetQuizByIdAsync(int quizId);
        Task<IEnumerable<Quiz>> GetAllQuizzesAsync();
        Task<Quiz> CreateQuizAsync(Quiz quiz);
        Task<Quiz> UpdateQuizAsync(Quiz quiz);
        Task<bool> DeleteQuizAsync(int quizId);

    
        Task<IEnumerable<Quiz>> GetAllQuizzesByStudentIdAsync(int studentId);
      
        
    
    }
}
