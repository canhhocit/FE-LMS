const fs = require('fs');
let code = fs.readFileSync('src/pages/shared/ClassDetail.tsx', 'utf8');

const importInject = `import { ManageMaterialsModal } from "../../components/ManageMaterialsModal";\n`;
if (!code.includes('ManageMaterialsModal')) {
    code = code.replace(`import { LessonDiscussion } from "../../components/LessonDiscussion";`, `import { LessonDiscussion } from "../../components/LessonDiscussion";\n` + importInject);
}

const stateInject = `  const [uploadingAttachmentLessonId, setUploadingAttachmentLessonId] = useState<number | null>(null);
  const [manageMaterialsLesson, setManageMaterialsLesson] = useState<Lesson | null>(null);`;
code = code.replace(`  const [uploadingAttachmentLessonId, setUploadingAttachmentLessonId] = useState<number | null>(null);`, stateInject);

const inlineControlsStart = `{/* Upload Controls for Lecturer */}`;
const inlineControlsEnd = `                                        {uploadStatus[lesson.id] && (
                                          <Toast 
                                            message={uploadStatus[lesson.id].message} 
                                            type={uploadStatus[lesson.id].type} 
                                            onClose={() => setUploadStatus(prev => { const next = {...prev}; delete next[lesson.id]; return next; })}
                                          />
                                        )}
                                      </div>
                                    )}`;

const newInlineControls = `{/* Upload Controls for Lecturer */}
                                    {isLecturer && (
                                      <div className="mt-2 flex w-full">
                                        <button
                                          onClick={() => setManageMaterialsLesson(lesson)}
                                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 transition cursor-pointer shadow-sm"
                                        >
                                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                          Quản lý học liệu (Video / Tài liệu)
                                        </button>
                                      </div>
                                    )}`;

const startIndex = code.indexOf(inlineControlsStart);
if(startIndex !== -1) {
  const endIndex = code.indexOf(inlineControlsEnd) + inlineControlsEnd.length;
  code = code.substring(0, startIndex) + newInlineControls + code.substring(endIndex);
}

const modalCode = `
      {manageMaterialsLesson && (
        <ManageMaterialsModal
          lesson={manageMaterialsLesson}
          onClose={() => setManageMaterialsLesson(null)}
          onUpdated={() => {
             loadChapters();
          }}
          uploadingVideoId={uploadingLessonId}
          uploadingAttachmentId={uploadingAttachmentLessonId}
          videoProgress={uploadProgress[manageMaterialsLesson.id] || 0}
          attachmentProgress={attachmentUploadProgress[manageMaterialsLesson.id] || 0}
          onUploadVideo={handleLessonVideoUpload}
          onUploadAttachment={handleLessonAttachmentUpload}
        />
      )}
`;

const insertIndex = code.lastIndexOf('</div>\n    </div>\n  );\n}');
if (insertIndex !== -1) {
  code = code.substring(0, insertIndex) + modalCode + code.substring(insertIndex);
}

fs.writeFileSync('src/pages/shared/ClassDetail.tsx', code);
console.log('done');
