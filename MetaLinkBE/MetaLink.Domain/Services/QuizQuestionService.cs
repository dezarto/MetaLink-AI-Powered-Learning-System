using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class QuizQuestionService : IQuizQuestionService
    {
        private readonly IQuizQuestionRepository _repository;

        public QuizQuestionService(IQuizQuestionRepository repository)
        {
            _repository = repository;
        }

        public async Task<QuizQuestion> GetQuizQuestionByIdAsync(int questionId)
        {
            return await _repository.GetQuizQuestionByIdAsync(questionId);
        }

        public async Task<IEnumerable<QuizQuestion>> GetAllQuizQuestionsAsync()
        {
            return await _repository.GetAllQuizQuestionsAsync();
        }

        public Task<IEnumerable<QuizQuestion>> GetQuestionsByQuizIdAsync(int quizId) =>
    _repository.GetQuestionsByQuizIdAsync(quizId);


        public async Task<QuizQuestion> CreateQuizQuestionAsync(QuizQuestion quizQuestion)
        {
            return await _repository.CreateQuizQuestionAsync(quizQuestion);
        }

        public async Task<QuizQuestion> UpdateQuizQuestionAsync(QuizQuestion quizQuestion)
        {
            return await _repository.UpdateQuizQuestionAsync(quizQuestion);
        }

        public async Task<bool> DeleteQuizQuestionAsync(int questionId)
        {
            return await _repository.DeleteQuizQuestionAsync(questionId);
        }
    }
}
