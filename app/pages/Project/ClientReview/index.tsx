import './styles.css';
import type { Project } from 'api/projects/projects.types';
import UserInfo from 'shared/sections/DocOverview/UserInfo';

export default function ClientReview({ review, projectTitle }: {
  review?: Project['payload']['review'];
  projectTitle: string;
}) {
  const text = review?.text?.trim();
  if (!text) return null;

  return (
    <section className="ProjectReview px" aria-labelledby="project-review-title">
      <h2 className="ProjectReview-title" id="project-review-title">Отзыв клиента</h2>
      <UserInfo
        userName=""
        userStatus=""
        docDescription={text}
        docLink={review?.pdf}
        docName={projectTitle}
        docFileName={review?.file_name ?? undefined}
        documentVariant="link"
        plainText
      />
    </section>
  );
}
