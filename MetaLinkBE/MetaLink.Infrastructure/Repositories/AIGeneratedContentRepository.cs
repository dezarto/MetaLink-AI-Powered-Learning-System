using MetaLink.Domain.Entities;
using Metalink.Infrastructure.Context;
using MetaLink.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace MetaLink.Persistence.Repositories
{
    public class AIGeneratedContentRepository : IAiGeneratedContentRepository
    {
        private readonly AppDbContext _context;

        public AIGeneratedContentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<AIGeneratedContent> CreateAsync(AIGeneratedContent content)
        {
            _context.AIGeneratedContents.Add(content);
            await _context.SaveChangesAsync();
            return content;
        }

        public async Task<AIGeneratedContent> GetByIdAsync(int id)
        {
            return await _context.AIGeneratedContents.FindAsync(id);
        }

        public async Task<IEnumerable<AIGeneratedContent>> GetAllAsync()
        {
            return await _context.AIGeneratedContents.ToListAsync();
        }

        public async Task<AIGeneratedContent> UpdateAsync(AIGeneratedContent content)
        {
            var trackedEntity = _context.AIGeneratedContents.Local
                .FirstOrDefault(x => x.ContentID == content.ContentID);

            if (trackedEntity != null)
            {
                _context.Entry(trackedEntity).State = EntityState.Detached;
            }

            _context.AIGeneratedContents.Update(content);
            await _context.SaveChangesAsync();

            return content;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var content = await _context.AIGeneratedContents.FindAsync(id);
            if (content == null) return false;

            string wwwRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var imagePaths = new List<string?>
            {
                content.GeneratedImage1,
                content.GeneratedImage2,
                content.GeneratedImage3
            };

            foreach (var imagePath in imagePaths)
            {
                if (!string.IsNullOrEmpty(imagePath))
                {
                    var fullPath = Path.Combine(wwwRootPath, imagePath.TrimStart('/').Replace("/", Path.DirectorySeparatorChar.ToString()));
                    if (File.Exists(fullPath))
                    {
                        File.Delete(fullPath);
                    }
                }
            }

            string audioFolder = Path.Combine(wwwRootPath, "contentaudios");
            if (Directory.Exists(audioFolder))
            {
                var audioFiles = Directory.GetFiles(audioFolder, $"{content.ContentID}.*");
                foreach (var file in audioFiles)
                {
                    File.Delete(file);
                }
            }

            _context.AIGeneratedContents.Remove(content);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
