import './styles.css';

function getEmbedSrc({ vid_embed, vid_provider }: any) {
  switch (vid_provider) {
    case 'youtube':
      return `${vid_embed}`;

    case 'rutube':
      return `${vid_embed}`;

    case 'vk':
      return vid_embed;

    default:
      return vid_embed;
  }
}

export default function Video({ data, id }: any) {
  const src = getEmbedSrc(data.fields);
  return (
    <section className="Video" id={id}>
      <iframe
        src={src}
        // allow="autoplay; fullscreen; picture-in-picture"
        // webkitAllowFullScreen
        // mozallowfullscreen
        allowFullScreen
        frameBorder="0"
        title="video"
      />
    </section>
  );
}
