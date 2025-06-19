using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class LearningStyleAnswerService : ILearningStyleAnswerService
    {
        private readonly ILearningStyleAnswerRepository _repository;

        public LearningStyleAnswerService(ILearningStyleAnswerRepository repository)
        {
            _repository = repository;
        }

        public async Task<LearningStyleAnswer> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<LearningStyleAnswer>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<LearningStyleAnswer> AddAsync(LearningStyleAnswer learningStyleAnswer)
        {
            return await _repository.AddAsync(learningStyleAnswer);
        }

        public async Task<LearningStyleAnswer> UpdateAsync(LearningStyleAnswer learningStyleAnswer)
        {
            return await _repository.UpdateAsync(learningStyleAnswer);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
