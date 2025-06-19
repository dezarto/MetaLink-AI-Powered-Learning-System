using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IAIGeneratedContentService
    {
        Task<AIGeneratedContent> CreateAIGeneratedContentAsync(AIGeneratedContent content);
        Task<AIGeneratedContent> GetAIGeneratedContentByIdAsync(int id);
        Task<IEnumerable<AIGeneratedContent>> GetAllAIGeneratedContentAsync();
        Task<AIGeneratedContent> UpdateAIGeneratedContentAsync(AIGeneratedContent content);
        Task<bool> DeleteAIGeneratedContentAsync(int id);
    }
}
