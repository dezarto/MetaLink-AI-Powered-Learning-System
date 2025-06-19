using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;
using Metalink.Domain.Entities;
using Metalink.Domain.Interfaces;
using MetaLink.Application.Requests;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Metalink.Application.Services
{
    public class StudentSubLessonAppService : IStudentSubLessonAppService
    {
        private readonly IStudentSubLessonRepository _repository;
        private readonly IMapper _mapper;
        public StudentSubLessonAppService(IStudentSubLessonRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }
        public async Task<StudentSubLessonDTO> EnrollSubLessonAsync(int studentId, EnrollSubLessonRequest request)
        {
            var enrollment = new StudentSubLesson
            {
                StudentId = studentId,
                SubLessonId = request.SubLessonId,
                CompletionDate = null,
                Progress = 0
            };
            await _repository.AddAsync(enrollment);
            await _repository.SaveChangesAsync();
            return _mapper.Map<StudentSubLessonDTO>(enrollment);
        }
        public async Task<List<StudentSubLessonDTO>> GetBySubLessonIdAsync(int subLessonId)
        {
            var enrollments = await _repository.GetBySubLessonIdAsync(subLessonId);
            return _mapper.Map<List<StudentSubLessonDTO>>(enrollments);
        }
        public async Task<List<StudentSubLessonDTO>> GetByStudentIdAsync(int studentId)
        {
            var enrollments = await _repository.GetByStudentIdAsync(studentId);
            return _mapper.Map<List<StudentSubLessonDTO>>(enrollments);
        }
    }
}
