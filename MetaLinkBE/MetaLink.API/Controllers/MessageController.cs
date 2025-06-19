using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MetaLink.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin, User, Student")]
    public class MessageController : ControllerBase
    {
        private readonly IMessageAppService _messageAppService;

        public MessageController(IMessageAppService messageAppService)
        {
            _messageAppService = messageAppService;
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessageAsync([FromBody] SendMessageRequest request)
        {
            try
            {
                var message = await _messageAppService.SendMessageAsync(request.SenderId, request.ReceiverId, request.Content);
                return Ok(message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("get-messages/{studentId}/{otherStudentId}")]
        public async Task<IActionResult> GetMessagesAsync(int studentId, int otherStudentId)
        {
            try
            {
                var messages = await _messageAppService.GetMessagesAsync(studentId, otherStudentId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("mark-as-read/{messageId}")]
        public async Task<IActionResult> MarkAsReadAsync(int messageId)
        {
            try
            {
                var message = await _messageAppService.MarkAsReadAsync(messageId);
                return Ok(message);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
