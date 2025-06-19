using Metalink.Domain.Entities;

namespace Metalink.Domain.Interfaces
{
    public interface IAiPromptRepository
    {
        Task<AiPrompt> CreateAsync(AiPrompt prompt);
        Task<AiPrompt?> GetByIdAsync(int id);
        Task<IEnumerable<AiPrompt>> GetAllAsync();
        Task<AiPrompt> UpdateAsync(AiPrompt prompt);
        Task<bool> DeleteAsync(int id);
    }
}
