using Metalink.Application.DTOs;
using MetaLink.Application.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Interfaces
{
    public interface IStudentSubLessonAppService
    {
        Task<List<StudentSubLessonDTO>> GetBySubLessonIdAsync(int subLessonId);
        Task<StudentSubLessonDTO> EnrollSubLessonAsync(int studentId, EnrollSubLessonRequest request);
        // New: list enrollments for a given student
        Task<List<StudentSubLessonDTO>> GetByStudentIdAsync(int studentId);
    }
}
