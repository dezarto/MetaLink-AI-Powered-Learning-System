using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IChatMessageRepository
    {
        Task AddAsync(ChatMessage message);
        Task<ChatMessage?> GetByIdAsync(int id);
        Task<List<ChatMessage>> GetAllAsync();
        Task<List<ChatMessage>> GetByUserAndChatTypeAsync(int studentId, string chatType);
        Task UpdateAsync(ChatMessage message);
        Task DeleteAsync(int id);
        Task DeleteOldestIfExceedsLimitAsync(int studentId, string chatType, int limit = 10);
    }
}
