using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MetaLink.Application.Requests
{
    public class GenerateQuiz
    {
        public int StudentId { get; set; }
        public int? SubLessonId { get; set; }
        public int? LessonId { get; set; }
        public bool QuickQuiz{ get; set; }
        public bool NormalQuiz { get; set; }
        public bool GeneralQuiz { get; set; }
    }
}
