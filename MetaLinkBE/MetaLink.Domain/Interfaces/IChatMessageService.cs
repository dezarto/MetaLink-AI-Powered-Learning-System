using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IChatMessageService
    {
        Task AddChatMessageAsync(ChatMessage message);
        Task<ChatMessage?> GetChatMessageByIdAsync(int id);
        Task<List<ChatMessage>> GetAllChatMessageAsync();
        Task<List<ChatMessage>> GetChatMessageByUserAndChatTypeAsync(int studentId, string chatType);
        Task UpdateChatMessageAsync(ChatMessage message);
        Task DeleteChatMessageAsync(int id);
        Task DeleteChatMessageOldestIfExceedsLimitAsync(int studentId, string chatType, int limit = 20);
    }
}
