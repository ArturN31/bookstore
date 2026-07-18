export const BookDetails = ({ book }: { book: Book }) => {
    const { title, author, publication_date, publisher, format, page_count, description } = book;

    return (
        <>
            <section>
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="text-justify leading-relaxed">{description}</p>
            </section>

            <hr
                aria-hidden="true"
                className="border-gray-200"
            />

            <section>
                <h2 className="mb-2 text-lg font-semibold">Technical Details</h2>
                <table className="w-full table-auto">
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { label: 'Title:', value: title },
                            { label: 'Author:', value: author },
                            { label: 'Publisher:', value: publisher },
                            { label: 'Publication date:', value: publication_date },
                            { label: 'Page count:', value: page_count },
                            { label: 'Format:', value: format },
                        ].map((detail) => (
                            <tr
                                className="grid grid-cols-2 py-2"
                                key={detail.label}
                            >
                                <th
                                    scope="row"
                                    className="text-left font-normal text-gray-600"
                                >
                                    {detail.label}
                                </th>
                                <td className="font-medium">{detail.value}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </>
    );
};
