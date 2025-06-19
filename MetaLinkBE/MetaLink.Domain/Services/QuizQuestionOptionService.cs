using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class QuizQuestionOptionService : IQuizQuestionOptionService
    {
        private readonly IQuizQuestionOptionRepository _repository;

        public QuizQuestionOptionService(IQuizQuestionOptionRepository repository)
        {
            _repository = repository;
        }

        public async Task<QuizQuestionOption> GetQuizQuestionOptionByIdAsync(int optionId)
        {
            return await _repository.GetQuizQuestionOptionByIdAsync(optionId);
        }

        public async Task<IEnumerable<QuizQuestionOption>> GetAllQuizQuestionOptionsAsync()
        {
            return await _repository.GetAllQuizQuestionOptionsAsync();
        }

        public async Task<QuizQuestionOption> CreateQuizQuestionOptionAsync(QuizQuestionOption quizQuestionOption)
        {
            return await _repository.CreateQuizQuestionOptionAsync(quizQuestionOption);
        }

        public async Task<QuizQuestionOption> UpdateQuizQuestionOptionAsync(QuizQuestionOption quizQuestionOption)
        {
            return await _repository.UpdateQuizQuestionOptionAsync(quizQuestionOption);
        }

        public Task<IEnumerable<QuizQuestionOption>> GetOptionsByQuestionIdAsync(int questionId) =>
      _repository.GetOptionsByQuestionIdAsync(questionId);

        public async Task<bool> DeleteQuizQuestionOptionAsync(int optionId)
        {
            return await _repository.DeleteQuizQuestionOptionAsync(optionId);
        }
    }
}
