using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class LearningStyleQuestionService : ILearningStyleQuestionService
    {
        private readonly ILearningStyleQuestionRepository _repository;

        public LearningStyleQuestionService(ILearningStyleQuestionRepository repository)
        {
            _repository = repository;
        }

        public async Task<LearningStyleQuestion> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<LearningStyleQuestion>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<LearningStyleQuestion> AddAsync(LearningStyleQuestion learningStyleQuestion)
        {
            return await _repository.AddAsync(learningStyleQuestion);
        }

        public async Task<LearningStyleQuestion> UpdateAsync(LearningStyleQuestion learningStyleQuestion)
        {
            return await _repository.UpdateAsync(learningStyleQuestion);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
