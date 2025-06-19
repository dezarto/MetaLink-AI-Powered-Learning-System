using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class AiPromptService : IAiPromptService
    {
        private readonly IAiPromptRepository _repository;

        public AiPromptService(IAiPromptRepository repository)
        {
            _repository = repository;
        }

        public async Task<AiPrompt> CreateAiPromptAsync(AiPrompt prompt)
        {
            return await _repository.CreateAsync(prompt);
        }

        public async Task<AiPrompt> GetAiPromptByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<AiPrompt>> GetAllAiPromptAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<AiPrompt> UpdateAiPromptAsync(AiPrompt prompt)
        {
            return await _repository.UpdateAsync(prompt);
        }

        public async Task<bool> DeleteAiPromptAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
