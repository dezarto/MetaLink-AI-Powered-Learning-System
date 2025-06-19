using AutoMapper;
using Metalink.Application.DTOs;
using Metalink.Domain.Entities;
using MetaLink.Application.DTOs;
using MetaLink.Domain.Entities;

namespace Metalink.Application.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<User, UserDTO>().ReverseMap();
            CreateMap<User, ParentDTO>().ReverseMap();
            CreateMap<Student, StudentDTO>().ReverseMap();
            CreateMap<Course, CourseDTO>().ReverseMap();
            CreateMap<Lesson, LessonDTO>().ReverseMap();
            CreateMap<SubLesson, SubLessonDTO>().ReverseMap();
            CreateMap<StudentCourse, StudentCourseDTO>().ReverseMap();
            CreateMap<StudentLesson, StudentLessonDTO>().ReverseMap();
            CreateMap<StudentSubLesson, StudentSubLessonDTO>().ReverseMap();
            CreateMap<AiPrompt, AiPromptDTO>().ReverseMap();
            CreateMap<Avatar, AvatarDTO>().ReverseMap(); 
            CreateMap<LearningStyleAnswer, LearningStyleAnswerDTO>().ReverseMap(); 
            CreateMap<CompanyProfile, CompanyProfileDTO>().ReverseMap();
            CreateMap<Game, GameDTO>().ReverseMap();
        }
    }
}
