interface TagBadgeProps {
    tag: string;
}

export default function TagBadge({ tag }: TagBadgeProps) {
    if (!tag) return null;
    const tagClass = `tag-${tag.toLowerCase().replace(/[\/\s]/g, '')}`;

    return (
        <span className={`tag-badge ${tagClass}`}>
            {tag}
        </span>
    );
}
