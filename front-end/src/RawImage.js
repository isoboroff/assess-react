function RawImage(props) {
  // props.data.img_type: image type (png, jpg, etc)
  // props.data.image: a Base64 string

  if (props.data) {
    if (props.data.img_type) {
      return (
        <figure>
          <img id="rawimage" src={"data:image/" + props.data.img_type + ";base64," + props.data.image}
            alt={props.data.attrib && props.data.attrib[0]} />
          <figcaption>{props.data.attrib && props.data.attrib[0]}</figcaption>
        </figure>
      );
    } else if (props.data.text) {
      return (
        <p>{props.data.text}</p>
      );
    }
  } else {
    return <p>No data</p>;
  }
}

export default RawImage;
