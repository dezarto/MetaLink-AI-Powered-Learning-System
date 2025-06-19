using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class ChatContextService : IChatContextService
    {
        private readonly IChatMessageService _chatMessageService;

        public ChatContextService(IChatMessageService chatMessageService)
        {
            _chatMessageService = chatMessageService;
        }

        public async Task<List<ChatGptMessage>> BuildMessageContextAsync(int studentId, string chatType, string systemPrompt, string newUserMessage)
        {
            var history = await _chatMessageService.GetChatMessageByUserAndChatTypeAsync(studentId, chatType);

            var messages = history.Select(m => new ChatGptMessage
            {
                role = m.Role,
                content = m.Message
            }).ToList();

            messages.Insert(0, new ChatGptMessage
            {
                role = "system",
                content = systemPrompt
            });

            messages.Add(new ChatGptMessage
            {
                role = "user",
                content = newUserMessage
            });

            return messages;
        }

        public async Task SaveNewMessagePairAsync(int studentId, string chatType, string userMessage, string assistantMessage)
        {
            await _chatMessageService.AddChatMessageAsync(new ChatMessage
            {
                StudentID = studentId,
                ChatType = chatType,
                Role = "user",
                Message = userMessage,
                CreateDate = DateTime.UtcNow
            });

            await _chatMessageService.DeleteChatMessageOldestIfExceedsLimitAsync(studentId, chatType);

            await _chatMessageService.AddChatMessageAsync(new ChatMessage
            {
                StudentID = studentId,
                ChatType = chatType,
                Role = "assistant",
                Message = assistantMessage,
                CreateDate = DateTime.UtcNow
            });

            await _chatMessageService.DeleteChatMessageOldestIfExceedsLimitAsync(studentId, chatType);
        }
    }
}
