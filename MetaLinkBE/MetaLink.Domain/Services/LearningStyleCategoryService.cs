using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class LearningStyleCategoryService : ILearningStyleCategoryService
    {
        private readonly ILearningStyleCategoryRepository _repository;

        public LearningStyleCategoryService(ILearningStyleCategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<LearningStyleCategory> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<LearningStyleCategory>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<LearningStyleCategory> AddAsync(LearningStyleCategory learningStyleCategory)
        {
            return await _repository.AddAsync(learningStyleCategory);
        }

        public async Task<LearningStyleCategory> UpdateAsync(LearningStyleCategory learningStyleCategory)
        {
            return await _repository.UpdateAsync(learningStyleCategory);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
