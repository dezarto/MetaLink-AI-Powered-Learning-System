using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IAiGeneratedContentRepository
    {
        Task<AIGeneratedContent> CreateAsync(AIGeneratedContent content);
        Task<AIGeneratedContent?> GetByIdAsync(int id);
        Task<IEnumerable<AIGeneratedContent>> GetAllAsync();
        Task<AIGeneratedContent> UpdateAsync(AIGeneratedContent content);
        Task<bool> DeleteAsync(int id);
    }
}
