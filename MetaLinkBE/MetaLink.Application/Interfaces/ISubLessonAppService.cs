using Metalink.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Interfaces
{
    public interface ISubLessonAppService
    {
        Task<List<SubLessonDTO>> GetAllAsync();
        Task<SubLessonDTO?> GetByIdAsync(int id);
        Task<List<SubLessonDTO>> GetByLessonIdAsync(int lessonId);
    }
}
