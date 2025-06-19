using MetaLink.Application.Interfaces;
using MetaLink.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MetaLink.API.Controllers
{
    [Route("api/chatgpt")]
    [ApiController]
    [Authorize(Roles = "Admin, User, Student")]
    public class ChatGptController : ControllerBase
    {
        private readonly IChatGptService _chatGptService;

        public ChatGptController(IChatGptService chatGptService)
        {
            _chatGptService = chatGptService;
        }

        [HttpPost("chat-with-avatar")]
        public async Task<IActionResult> SendMessageAvatarChat([FromBody] UserMessage message)
        {
            var response = await _chatGptService.AvatarChatMessageAsync(message);
            return Ok(response);
        }

        [HttpPost("chat-with-avatar-audio")]
        public async Task<IActionResult> SendAudioAvatarChat([FromForm] IFormFile audio, [FromForm] int studentId)
        {
            if (audio == null || audio.Length == 0)
                return BadRequest("Ses dosyası gereklidir.");
            if (studentId <= 0)
                return BadRequest("StudentId gereklidir.");

            var response = await _chatGptService.HandleAudioAvatarChatAsync(audio, studentId);
            return Ok(response);
        }

        [HttpPost("ask-question-assistant-robot")]
        public async Task<IActionResult> AskQuestionAssistantRobot([FromBody] UserMessage message)
        {
            var response = await _chatGptService.AskQuestionAssistantRobot(message);
            return Ok(response);
        }
    }
}
