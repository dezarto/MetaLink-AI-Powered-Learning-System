using Metalink.Application.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Interfaces
{
    public interface ILessonAppService
    {
        Task<List<LessonDTO>> GetAllAsync();
        Task<LessonDTO?> GetByIdAsync(int id);
        Task<List<LessonDTO>> GetByCourseIdAsync(int courseId);
    }
}
