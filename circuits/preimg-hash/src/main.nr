use dep::std;

fn main(
	x: Field,
	y: Field,
	out_x: pub Field,
) {
	let res = std::hash::pedersen([x, y]);

	constrain res[0] == out_x;
}
