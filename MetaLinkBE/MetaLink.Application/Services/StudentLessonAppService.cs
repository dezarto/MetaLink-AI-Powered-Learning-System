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
    public class StudentLessonAppService : IStudentLessonAppService
    {
        private readonly IStudentLessonRepository _repository;
        private readonly IMapper _mapper;
        public StudentLessonAppService(IStudentLessonRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }
        public async Task<StudentLessonDTO> EnrollLessonAsync(int studentId, EnrollLessonRequest request)
        {
            var enrollment = new StudentLesson
            {
                StudentId = studentId,
                LessonId = request.LessonId,
                CompletionDate = null,
                Progress = 0
            };
            await _repository.AddAsync(enrollment);
            await _repository.SaveChangesAsync();
            return _mapper.Map<StudentLessonDTO>(enrollment);
        }
        public async Task<List<StudentLessonDTO>> GetByLessonIdAsync(int lessonId)
        {
            var enrollments = await _repository.GetByLessonIdAsync(lessonId);
            return _mapper.Map<List<StudentLessonDTO>>(enrollments);
        }
        public async Task<List<StudentLessonDTO>> GetByStudentIdAsync(int studentId)
        {
            var enrollments = await _repository.GetByStudentIdAsync(studentId);
            return _mapper.Map<List<StudentLessonDTO>>(enrollments);
        }
    }
}
