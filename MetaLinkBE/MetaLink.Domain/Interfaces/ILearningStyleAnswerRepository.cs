using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ILearningStyleAnswerRepository
    {
        Task<LearningStyleAnswer> GetByIdAsync(int id);
        Task<IEnumerable<LearningStyleAnswer>> GetAllAsync();
        Task<LearningStyleAnswer> AddAsync(LearningStyleAnswer learningStyleAnswer);
        Task<LearningStyleAnswer> UpdateAsync(LearningStyleAnswer learningStyleAnswer);
        Task<bool> DeleteAsync(int id);
    }
}
