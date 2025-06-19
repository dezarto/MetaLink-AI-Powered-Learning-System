using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class GameService : IGameService
    {
        private readonly IGameProgressRepository _gameProgressRepository;
        private readonly IGameRepository _gameRepository;

        public GameService(IGameProgressRepository gameProgressRepository, IGameRepository gameRepository)
        {
            _gameProgressRepository = gameProgressRepository;
            _gameRepository = gameRepository;
        }

        public async Task SaveGameProgressAsync(int studentId, int gameId, string progressData)
        {
            var progress = await _gameProgressRepository.GetByStudentAndGameAsync(studentId, gameId);
            if (progress == null)
            {
                progress = new GameProgress
                {
                    StudentId = studentId,
                    GameId = gameId,
                    ProgressData = progressData,
                    LastUpdated = DateTime.UtcNow
                };
                await _gameProgressRepository.AddAsync(progress);
            }
            else
            {
                progress.ProgressData = progressData;
                progress.LastUpdated = DateTime.UtcNow;
                await _gameProgressRepository.UpdateAsync(progress);
            }
        }

        public async Task<string> GetGameProgressAsync(int studentId, int gameId)
        {
            var progress = await _gameProgressRepository.GetByStudentAndGameAsync(studentId, gameId);
            return progress?.ProgressData;
        }

        public async Task<Game> GetByIdAsync(int id)
        {
            return await _gameRepository.GetByIdAsync(id);
        }

        public async Task<List<Game>> GetAllAsync()
        {
            return await _gameRepository.GetAllAsync();
        }

        public async Task AddAsync(Game game)
        {
            await _gameRepository.AddAsync(game);
        }

        public async Task UpdateAsync(Game game)
        {
            await _gameRepository.UpdateAsync(game);
        }

        public async Task DeleteAsync(int id)
        {
            await _gameRepository.DeleteAsync(id);
        }
    }
}
