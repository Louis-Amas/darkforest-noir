use dep::std;

fn main(
	x1: u64,
	y1: u64,
	x2: u64,
	y2: u64,
	salt: Field,
	hash_x1_y1: pub Field,
	hash_x2_y2: pub Field,
) {
	constrain (x2 - x1) < 4;
	constrain (y2 - y1) < 4;

	let _hash_x1_y1 = std::hash::pedersen([x1 as Field, y1 as Field, salt]);

	constrain _hash_x1_y1[0] == hash_x1_y1;

	let _hash_x2_y2 = std::hash::pedersen([x2 as Field, y2 as Field, salt]);

	constrain _hash_x2_y2[0] == hash_x2_y2;
}
