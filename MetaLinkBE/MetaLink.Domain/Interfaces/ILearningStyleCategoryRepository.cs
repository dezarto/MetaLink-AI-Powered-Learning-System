using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ILearningStyleCategoryRepository
    {
        Task<LearningStyleCategory> GetByIdAsync(int id);
        Task<IEnumerable<LearningStyleCategory>> GetAllAsync();
        Task<LearningStyleCategory> AddAsync(LearningStyleCategory learningStyleCategory);
        Task<LearningStyleCategory> UpdateAsync(LearningStyleCategory learningStyleCategory);
        Task<bool> DeleteAsync(int id);
    }
}
