using MetaLink.Application.Requests;
using MetaLink.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MetaLink.API.Controllers
{
    [Route("api/xp")]
    [ApiController]
    [Authorize(Roles = "Admin, User, Student")]
    public class XPController : ControllerBase
    {
        private readonly IXPService _xpService;

        public XPController(IXPService xpService)
        {
            _xpService = xpService;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessXP([FromBody] ProcessXPRequest request)
        {
            var success = await _xpService.ProcessXPAsync(request.StudentId, request.GameId, request.Amount, request.XPType, description: request.Description);
            if (!success)
                return BadRequest("XP yetersiz.");
            return Ok(request.Amount);
        }

        [HttpGet("total/{studentId}")]
        public async Task<IActionResult> GetTotalXP(int studentId)
        {
            var totalXP = await _xpService.GetAvailableXPAsync(studentId);
            return Ok(totalXP);
        }

        [HttpGet("records/{studentId}")]
        public async Task<IActionResult> GetXPRecords(int studentId)
        {
            var records = await _xpService.GetXPRecordsAsync(studentId);
            return Ok(records);
        }
    }
}
