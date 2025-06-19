using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MetaLink.API.Controllers
{
    [Route("api/games")]
    [ApiController]
    [Authorize(Roles = "Admin, User, Student")]
    public class GameController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly IGameInviteService _gameInviteService;
        private readonly IChatGptService _chatGptService;

        public GameController(IGameService gameService, IGameInviteService gameInviteService, IChatGptService chatGptService)
        {
            _gameService = gameService;
            _gameInviteService = gameInviteService;
            _chatGptService = chatGptService;
        }

        [HttpGet("games")]
        public async Task<IActionResult> GetAllGames()
        {
            var games = await _gameService.GetAllAsync();
            return Ok(games);
        }

        [HttpGet("invites/pending/{studentId}")]
        public async Task<IActionResult> GetPendingInvites(int studentId)
        {
            var invites = await _gameInviteService.CheckInviteAsync(studentId);
            return Ok(invites);
        }

        [HttpPost("progress")]
        public async Task<IActionResult> SaveProgress([FromBody] SaveProgressRequest request)
        {
            await _gameService.SaveGameProgressAsync(request.StudentId, request.GameId, request.ProgressData);
            return Ok();
        }

        [HttpGet("progress/{studentId}/{gameId}")]
        public async Task<IActionResult> GetProgress(int studentId, int gameId)
        {
            var progress = await _gameService.GetGameProgressAsync(studentId, gameId);
            return Ok(progress);
        }

        [HttpPost("story")]
        public async Task<IActionResult> GenerateStory([FromBody] GenerateStoryRequest request)
        {
            var story = await _chatGptService.GenerateStoryAsync(request.StudentId, request.CardCount);
            return Ok(story);
        }
    }
}
