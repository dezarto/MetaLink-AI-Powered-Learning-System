using Metalink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IAiPromptService
    {
        Task<AiPrompt> CreateAiPromptAsync(AiPrompt prompt);
        Task<AiPrompt> GetAiPromptByIdAsync(int id);
        Task<IEnumerable<AiPrompt>> GetAllAiPromptAsync();
        Task<AiPrompt> UpdateAiPromptAsync(AiPrompt prompt);
        Task<bool> DeleteAiPromptAsync(int id);
    }
}
