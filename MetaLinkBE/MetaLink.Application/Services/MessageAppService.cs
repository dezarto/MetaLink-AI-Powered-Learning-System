using Metalink.Domain.Interfaces;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Application.Services
{
    public class MessageAppService : IMessageAppService
    {
        private readonly IMessageService _messageService;
        private readonly IEncryptionService _encryptionService;
        private readonly IChatGptService _chatGptService;
        private readonly IStudentService _studentService;
        private readonly IUserService _userService;

        public MessageAppService(IMessageService messageService, IEncryptionService encryptionService, IChatGptService chatGptService, IStudentService studentService, IUserService userService)
        {
            _messageService = messageService;
            _encryptionService = encryptionService;
            _chatGptService = chatGptService;
            _studentService = studentService;
            _userService = userService;
        }

        public async Task<Message> SendMessageAsync(int senderId, int receiverId, string content)
        {
            if (senderId == receiverId)
                throw new ArgumentException("Cannot send message to self.");

            var student = await _studentService.GetByIdAsync(senderId);
            if(student == null) throw new ArgumentNullException("Student not found!", nameof(student));
            var parent = await _userService.GetByIdAsync(student.UserID);
            if (parent == null) throw new ArgumentNullException("Parent not found!", nameof(parent));

            var analyzeMessageRequest = new AnalizeMessageContentRequest
            {
                ParentMail = parent.Email,
                ParentName = parent.FirstName,
                ParentLastName = parent.LastName,
                StudentName = student.FirstName,
                StudentLastName = student.LastName,
            };

            _ = Task.Run(() => _chatGptService.AnalyzeMessageContentAsync(content, analyzeMessageRequest));

            var encryptedContent = _encryptionService.Encrypt(content);

            var message = new Message
            {
                SenderStudentId = senderId,
                ReceiverStudentId = receiverId,
                MessageTXT = encryptedContent,
                SentAt = DateTime.UtcNow,
                IsRead = false
            };

            var encMessage = await _messageService.AddAsync(message);

            encMessage.MessageTXT = _encryptionService.Decrypt(encMessage.MessageTXT);

            return encMessage;
        }

        public async Task<IEnumerable<Message>> GetMessagesAsync(int studentId, int otherStudentId)
        {
            var messages = await _messageService.GetMessagesAsync(studentId, otherStudentId);

            foreach (var msg in messages)
            {
                msg.MessageTXT = _encryptionService.Decrypt(msg.MessageTXT);
            }

            return messages;
        }

        public async Task<Message> MarkAsReadAsync(int messageId)
        {
            var message = await _messageService.GetByIdAsync(messageId);
            if (message == null)
                throw new ArgumentException("Message not found.");

            message.IsRead = true;
            return await _messageService.UpdateAsync(message);
        }
    }
}
