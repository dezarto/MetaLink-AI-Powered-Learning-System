using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface ILearningStyleQuestionService
    {
        Task<LearningStyleQuestion> GetByIdAsync(int id);
        Task<IEnumerable<LearningStyleQuestion>> GetAllAsync();
        Task<LearningStyleQuestion> AddAsync(LearningStyleQuestion learningStyleQuestion);
        Task<LearningStyleQuestion> UpdateAsync(LearningStyleQuestion learningStyleQuestion);
        Task<bool> DeleteAsync(int id);
    }
}
