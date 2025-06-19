using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class AIGeneratedContentService : IAIGeneratedContentService
    {
        private readonly IAiGeneratedContentRepository _repository;

        public AIGeneratedContentService(IAiGeneratedContentRepository repository)
        {
            _repository = repository;
        }

        public async Task<AIGeneratedContent> CreateAIGeneratedContentAsync(AIGeneratedContent content)
        {
            return await _repository.CreateAsync(content);
        }

        public async Task<AIGeneratedContent> GetAIGeneratedContentByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<AIGeneratedContent>> GetAllAIGeneratedContentAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<AIGeneratedContent> UpdateAIGeneratedContentAsync(AIGeneratedContent content)
        {
            return await _repository.UpdateAsync(content);
        }

        public async Task<bool> DeleteAIGeneratedContentAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
}
