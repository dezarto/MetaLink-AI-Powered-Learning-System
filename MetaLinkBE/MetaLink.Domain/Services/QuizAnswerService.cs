using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class QuizAnswerService : IQuizAnswerService
    {
        private readonly IQuizAnswerRepository _repository;

        public QuizAnswerService(IQuizAnswerRepository repository)
        {
            _repository = repository;
        }

        public async Task<QuizAnswer> GetAnswerByStudentAndQuizAsync(int studentId, int quizId)
        {
            return await _repository.GetAnswerByStudentAndQuizAsync(studentId, quizId);
        }

        public async Task<IEnumerable<QuizAnswer>> GetAllQuizAnswersAsync()
        {
            return await _repository.GetAllQuizAnswersAsync();
        }

        public async Task<QuizAnswer> CreateQuizAnswerAsync(QuizAnswer quizAnswer)
        {
            return await _repository.CreateQuizAnswerAsync(quizAnswer);
        }

        public async Task<QuizAnswer> UpdateQuizAnswerAsync(QuizAnswer quizAnswer)
        {
            return await _repository.UpdateQuizAnswerAsync(quizAnswer);
        }


        public async Task SaveChangesAsync()
        {
            await _repository.SaveChangesAsync();
        }

        public async Task<bool> DeleteQuizAnswerAsync(int quizAnswerId)
        {
            return await _repository.DeleteQuizAnswerAsync(quizAnswerId);
        }
    }
}
