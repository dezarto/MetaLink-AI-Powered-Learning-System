using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IChatContextService
    {
        Task<List<ChatGptMessage>> BuildMessageContextAsync(int studentId, string chatType, string systemPrompt, string newUserMessage);
        Task SaveNewMessagePairAsync(int studentId, string chatType, string userMessage, string assistantMessage);
    }
}
