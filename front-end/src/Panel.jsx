// A useful simple widget to contain things that should be 100% of their
// available height and scroll vertically.
export default function Panel( {children} ) {
  return (
    <div style={{
           height: '100%',
           overflowY: 'auto'
         }}>
      {children}
    </div>
  );
}
