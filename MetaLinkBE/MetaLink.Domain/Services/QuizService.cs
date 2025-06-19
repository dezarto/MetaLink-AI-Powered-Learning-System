using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class QuizService : IQuizService
    {
        private readonly IQuizRepository _repository;

        public QuizService(IQuizRepository repository)
        {
            _repository = repository;
        }

        public async Task<Quiz> GetQuizByIdAsync(int quizId)
        {
            return await _repository.GetQuizByIdAsync(quizId);
        }

        public async Task<IEnumerable<Quiz>> GetAllQuizzesAsync()
        {
            return await _repository.GetAllQuizzesAsync();
        }

        public async Task<Quiz> CreateQuizAsync(Quiz quiz)
        {
            return await _repository.CreateQuizAsync(quiz);
        }

        public async Task<Quiz> UpdateQuizAsync(Quiz quiz)
        {
            return await _repository.UpdateQuizAsync(quiz);
        }

        public async Task<bool> DeleteQuizAsync(int quizId)
        {
            return await _repository.DeleteQuizAsync(quizId);
        }

       

        public async Task<IEnumerable<Quiz>> GetAllQuizzesByStudentIdAsync(int studentId)
           => await _repository.GetAllQuizzesByStudentIdAsync(studentId);

    }
}
